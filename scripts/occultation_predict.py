#!/usr/bin/env python3
"""
occultation_predict.py
大气与电离层掩星事件预报主程序
输入：TLE文件、卫星类型表、时间区间
输出：掩星事件的经纬高序列（JSON），便于python或javascripts读取
"""
import os
import json
import numpy as np
from datetime import datetime, timedelta, timezone
from sgp4.api import Satrec, jday
from pyproj import Transformer
from scipy.interpolate import interp1d
from concurrent.futures import ProcessPoolExecutor
from functools import partial
from typing import List, Dict, Tuple
from astropy.time import Time
import astropy.units as u

TLE_FILE = "./scripts/Rx-YY_20250718.tle"  # TLE文件路径
OUTPUT_FILE = "./assets/traj/occultation_events.json"  # 输出文件
ORBIT_FILE = "./assets/traj/satellite_orbits.json"  # 轨道输出文件
AZIM_WIDTH = 50  # 方位角宽度（度）
TIME_STEP = 30  # 轨道计算采样间隔（秒）
IONO_STEP = 20  # 电离层掩星细化采样（秒）
ATM_STEP = 5    # 大气掩星细化采样（秒）

transformer = Transformer.from_crs(4978, 4326, always_xy=True)

# =====================
# TLE读取（不构造Satrec对象）
# =====================
def read_tle_list(tle_file: str) -> List[Dict]:
    """读取TLE文件，返回卫星信息字典列表（含名称、类型、TLE行）"""
    sats = []
    with open(tle_file, 'r') as f:
        lines = f.readlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith('#'):
            parts = line[1:].strip().split()
            name = parts[0]
            typ = parts[1][1:-1] if len(parts) > 1 and '(' in parts[1] else 'UNKNOWN'
            tle1 = lines[i+1].strip()
            tle2 = lines[i+2].strip()
            sats.append({"name": name, "type": typ, "tle1": tle1, "tle2": tle2})
            i += 3
        else:
            i += 1
    return sats

# =====================
# SGP4轨道计算（ECI->ECEF）
# =====================
def propagate_orbit(satrec, jd_fr_list) -> np.ndarray:
    """SGP4计算轨道，输入为satrec对象和(jd, fr)数组，返回ECI坐标序列 (N,3)"""
    eci = []
    for jd, fr in jd_fr_list:
        e, r, v = satrec.sgp4(jd, fr)
        if e == 0:
            eci.append([r[0],r[1],r[2],v[0],v[1],v[2]])
        else:
            eci.append([np.nan, np.nan, np.nan,np.nan, np.nan, np.nan])
    return np.array(eci)

def eci_to_ecef(eci_pos: np.ndarray, times: List[datetime]) -> np.ndarray:
    """使用GAST进行ECI->ECEF转换（考虑岁差、章动等效应）"""
    ecef = []
    for i, r in enumerate(eci_pos):
        # 使用astropy计算GAST（格林尼治视恒星时）
        t = Time(times[i], scale='utc')
        gast = t.sidereal_time('apparent', 'greenwich')
        theta = gast.to(u.radian).value
        
        x, y, z = r[0], r[1], r[2]
        vx, vy, vz = r[3], r[4], r[5]
        
        # 使用GAST进行坐标转换
        x_ecef = x * np.cos(theta) + y * np.sin(theta)
        y_ecef = -x * np.sin(theta) + y * np.cos(theta)
        xv_ecef = vx * np.cos(theta) + vy * np.sin(theta)
        yv_ecef = -vx * np.sin(theta) + vy * np.cos(theta)
        
        ecef.append([x_ecef, y_ecef, z, xv_ecef, yv_ecef, vz])
    return np.array(ecef)

def ecef_to_llh(ecef_pos: np.ndarray) -> np.ndarray:
    """ECEF坐标转换为经纬高"""
    llh = []
    for pos in ecef_pos:
        lon, lat, alt = transformer.transform(pos[0]*1e3, pos[1]*1e3, pos[2]*1e3)
        alt = alt / 1e3  # 转换为km
        llh.append([lon, lat, alt])
    return np.array(llh)

# =====================
# 并行轨道计算函数（需为全局函数）
# =====================
def get_ecef(sat, times, jd_fr_list):
    satrec = Satrec.twoline2rv(sat["tle1"], sat["tle2"])
    eci = propagate_orbit(satrec, jd_fr_list)
    ecef = eci_to_ecef(eci, times)
    return ecef

# =====================
# 切点几何与高度角
# =====================
def calc_tangent_point(txv, rxv) -> Tuple[float, float, float, float,float]:
    tx,rx,rv=txv[0:3],rxv[0:3],rxv[3:6]
    drt=tx-rx
    lrt=np.sum(drt[:]**2.0)**0.5
    r0=np.sum(rx[:]**2.0)**0.5
    v0=np.sum(rv[:]**2.0)**0.5
    if lrt<1e-3:return np.nan,np.nan,np.nan,np.nan,np.nan
    if r0<1e-3:return np.nan,np.nan,np.nan,np.nan,np.nan
    if v0<1e-3:return np.nan,np.nan,np.nan,np.nan,np.nan
    drt0=drt/lrt # unit vector of sats-link
    rx0=rx/r0
    rv0=rv/v0
    tp=rx-np.dot(rx,drt0)*drt0 # caculating target point
    #if rx&tx at sameside,prt would be positive.
    lon, lat, alt = transformer.transform(tp[0]*1e3, tp[1]*1e3, tp[2]*1e3)
    alt = alt / 1e3
    elev = np.arcsin(np.dot(rx0, drt0)) * 180/np.pi
    azim = np.arcsin(np.dot(rv0, drt0)) * 180/np.pi
    return lon, lat, alt, elev,azim

# =====================
# 掩星类型判别
# =====================
def classify_occultation(alt: float, elev: float,azim:float) -> str:
    if np.isnan(alt) or np.isnan(elev):
        return "none"
    if elev > 0 or abs(azim)>AZIM_WIDTH:
        return "none"
    if alt > 60:
        return "iono"
    elif -50 < alt <= 60:
        return "atm"
    elif alt <= -50:
        return "deep"
    return "none"

# =====================
# 轨道插值
# =====================
def interpolate_orbit(times, pos, new_times) -> np.ndarray:
    pos = np.asarray(pos)
    new_pos = np.zeros((len(new_times), 6))
    for i in range(6):
        f = interp1d([(t - times[0]).total_seconds() for t in times], pos[:, i], kind='linear', fill_value='extrapolate')
        new_pos[:, i] = f([(t - times[0]).total_seconds() for t in new_times])
    return new_pos

def process_nav_sat(nav, leo_sats, nav_orbits, leo_orbits, times):
    import os
    nav_name = nav["name"]
    print(f"[PID {os.getpid()}] 开始处理导航卫星 {nav_name}", flush=True)
    events = []
    state = {}
    state_change_time = {}
    for leo in leo_sats:
        leo_name = leo["name"]
        nav_pos_seq = nav_orbits[nav_name]
        leo_pos_seq = leo_orbits[leo_name]
        state[leo_name] = "none"
        state_change_time[leo_name] = times[0]
        for i, t in enumerate(times):
            nav_pos = nav_pos_seq[i]
            leo_pos = leo_pos_seq[i]
            lon, lat, alt, elev,azim = calc_tangent_point(nav_pos, leo_pos)
            occ_type = classify_occultation(alt, elev,azim)
            if occ_type != state[leo_name]:
                if state[leo_name] == "iono":
                    t0 = state_change_time[leo_name]-timedelta(seconds=TIME_STEP)
                    event_time = t0 + (t - t0)/2
                    fine_times = [t0 + timedelta(seconds=s) for s in range(0, int((t-t0).total_seconds())+1, IONO_STEP)]
                    nav_fine = interpolate_orbit(times, nav_pos_seq, fine_times)
                    leo_fine = interpolate_orbit(times, leo_pos_seq, fine_times)
                    points = []
                    for j in range(len(fine_times)):
                        lon2, lat2, alt2, elev2,azim2 = calc_tangent_point(nav_fine[j], leo_fine[j])
                        occ_type = classify_occultation(alt2, elev2,azim2)
                        if occ_type == "iono":
                            points.append({"time": fine_times[j].isoformat(), "lon": lon2, "lat": lat2, "alt": alt2, "elev": elev2})
                    events.append({"type": "iono", "nav": nav_name, "leo": leo_name, "time": event_time.isoformat(), "points": points})
                elif state[leo_name] == "atm":
                    t0 = state_change_time[leo_name]-timedelta(seconds=TIME_STEP)
                    event_time = t0 + (t - t0)/2
                    fine_times = [t0 + timedelta(seconds=s) for s in range(0, int((t-t0).total_seconds())+1, ATM_STEP)]
                    nav_fine = interpolate_orbit(times, nav_pos_seq, fine_times)
                    leo_fine = interpolate_orbit(times, leo_pos_seq, fine_times)
                    points = []
                    for j in range(len(fine_times)):
                        lon2, lat2, alt2, elev2,azim2 = calc_tangent_point(nav_fine[j], leo_fine[j])
                        occ_type = classify_occultation(alt2, elev2,azim2)
                        if occ_type == "atm":
                            points.append({"time": fine_times[j].isoformat(), "lon": lon2, "lat": lat2, "alt": alt2, "elev": elev2})
                    events.append({"type": "atm", "nav": nav_name, "leo": leo_name, "time": event_time.isoformat(), "points": points})
                state[leo_name] = occ_type
                state_change_time[leo_name] = t
    print(f"[PID {os.getpid()}] 完成导航卫星 {nav_name}", flush=True)
    return events

# =====================
# 主流程
# =====================
def main():
    satellites = read_tle_list(TLE_FILE)
    nav_sats = [s for s in satellites if s["type"] == "GNSS"]
    leo_sats = [s for s in satellites if s["type"] != "GNSS"]

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(hours=3)
    times = [start_time + timedelta(seconds=i) for i in range(0, int((end_time-start_time).total_seconds())+1, TIME_STEP)]
    jd_fr_list = [jday(t.year, t.month, t.day, t.hour, t.minute, t.second + t.microsecond*1e-6) for t in times]

    print(f"[主进程] 轨道计算（{len(nav_sats)}个导航卫星, {len(leo_sats)}个低轨卫星, {len(times)}步）...", flush=True)
    with ProcessPoolExecutor() as executor:
        nav_ecef = list(executor.map(partial(get_ecef, times=times, jd_fr_list=jd_fr_list), nav_sats))
        leo_ecef = list(executor.map(partial(get_ecef, times=times, jd_fr_list=jd_fr_list), leo_sats))
    print(f"[主进程] 轨道计算完成，开始并行事件判别...", flush=True)
    nav_orbits = {nav_sats[i]["name"]: nav_ecef[i] for i in range(len(nav_sats))}
    leo_orbits = {leo_sats[i]["name"]: leo_ecef[i] for i in range(len(leo_sats))}

    # 处理轨道数据输出
    print(f"[主进程] 开始处理轨道数据输出...", flush=True)
    orbit_data = {
        "metadata": {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "time_step": TIME_STEP,
            "total_satellites": len(satellites),
            "nav_satellites": len(nav_sats),
            "leo_satellites": len(leo_sats)
        },
        "satellites": {}
    }
    
    # 处理导航卫星轨道
    for i, nav in enumerate(nav_sats):
        nav_name = nav["name"]
        nav_ecef_pos = nav_ecef[i]
        nav_llh = ecef_to_llh(nav_ecef_pos)
        
        orbit_data["satellites"][nav_name] = {
            "type": "GNSS",
            "tle_name": nav["name"],
            "tle_type": nav["type"],
            "positions": []
        }
        
        for j, t in enumerate(times):
            if not np.isnan(nav_llh[j][0]):  # 检查是否为有效数据
                orbit_data["satellites"][nav_name]["positions"].append({
                    "time": t.isoformat(),
                    "lon": float(nav_llh[j][0]),
                    "lat": float(nav_llh[j][1]),
                    "alt": float(nav_llh[j][2])
                })
    
    # 处理低轨卫星轨道
    for i, leo in enumerate(leo_sats):
        leo_name = leo["name"]
        leo_ecef_pos = leo_ecef[i]
        leo_llh = ecef_to_llh(leo_ecef_pos)
        
        orbit_data["satellites"][leo_name] = {
            "type": "LEO",
            "tle_name": leo["name"],
            "tle_type": leo["type"],
            "positions": []
        }
        
        for j, t in enumerate(times):
            if not np.isnan(leo_llh[j][0]):  # 检查是否为有效数据
                orbit_data["satellites"][leo_name]["positions"].append({
                    "time": t.isoformat(),
                    "lon": float(leo_llh[j][0]),
                    "lat": float(leo_llh[j][1]),
                    "alt": float(leo_llh[j][2])
                })
    
    # 保存轨道数据
    with open(ORBIT_FILE, "w") as f:
        json.dump(orbit_data, f, indent=2, ensure_ascii=False)
    print(f"[主进程] 轨道数据已保存到 {ORBIT_FILE}", flush=True)

    with ProcessPoolExecutor() as executor:
        nav_events_list = list(executor.map(
            partial(process_nav_sat, leo_sats=leo_sats, nav_orbits=nav_orbits, leo_orbits=leo_orbits, times=times),
            nav_sats
        ))
    print(f"[主进程] 所有导航卫星事件判别完成，合并输出...", flush=True)
    events = []
    for ev in nav_events_list:
        events.extend(ev)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    print(f"[主进程] 结果已保存到 {OUTPUT_FILE}", flush=True)

if __name__ == "__main__":
    main() 
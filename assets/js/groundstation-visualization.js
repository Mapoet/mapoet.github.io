const orbitFile = '/assets/traj/satellite_orbits.json';
const visibilityFile = '/assets/traj/visibility_events.json';
// 移除 stationFile 相关内容

const statusDiv = document.getElementById('status');


// 设置Cesium Ion访问令牌 - 使用用户申请的token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzOTZhYjUxMy0yM2RhLTQzYTQtYjVmNy1hNTI1NjZiNGI5NDgiLCJpZCI6MzIyODkzLCJpYXQiOjE3NTI4ODExMTd9.ZW3143EaO-0r7H7Tr9Q0rfboNl2FjBWUzm2JgcEKj5g';


function showStatus(message) {
    statusDiv.innerHTML = message;
}
// 移除 parseStationData 函数

function addGroundStations(viewer, stations) {
    stations.forEach(st => {
        if (!isFinite(st.lon) || !isFinite(st.lat) || !isFinite(st.alt)) {
            console.warn('无效地面站坐标，已跳过:', st);
            return;
        }
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(st.lon, st.lat, st.alt * 1000),
            point: { pixelSize: 7, color: Cesium.Color.RED },
            label: { text: st.name || st["EN-Name"], font: '10pt sans-serif', fillColor: Cesium.Color.WHITE, show: true, pixelOffset: new Cesium.Cartesian2(0, -18) }
        });
    });
}

// 存储轨道实体和原始轨道点
let satelliteOrbitEntities = {};
let satelliteOrbitRawData = {};
let orbitTimeList = {};

function addSatelliteOrbits(viewer, orbitData) {
    satelliteOrbitEntities = {};
    satelliteOrbitRawData = {};
    orbitTimeList = {};
    Object.keys(orbitData.satellites).forEach(satName => {
        const satellite = orbitData.satellites[satName];
        // 过滤非法点
        const validPositions = (satellite.positions || [])
            .filter(pos => isFinite(pos.lon) && isFinite(pos.lat) && isFinite(pos.alt) && pos.time)
            .map(pos => ({
                cart3: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000),
                time: new Date(pos.time)
            }));
        if (validPositions.length < 2) {
            console.warn('轨道点数不足或存在无效点，已跳过:', satName);
            return;
        }
        let color = satellite.type === 'GNSS' ? Cesium.Color.YELLOW.withAlpha(0.7) : Cesium.Color.LIME.withAlpha(0.7);
        // 初始只显示全部轨道，后续onTick动态更新
        const entity = viewer.entities.add({
            id: `orbit_${satName}`,
            name: `${satellite.type} 轨道 ${satName}`,
            polyline: { positions: validPositions.map(p => p.cart3), width: 1.5, material: color, clampToGround: false }
        });
        satelliteOrbitEntities[satName] = entity;
        satelliteOrbitRawData[satName] = validPositions;
        orbitTimeList[satName] = validPositions.map(p => p.time);
    });
}

function addVisibilityArcs(viewer, visibilityData) {
    visibilityData.forEach((ev, idx) => {
        const positions = (ev.points || [])
            .filter(p => isFinite(p.lon) && isFinite(p.lat) && isFinite(p.alt))
            .map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * 1000));
        if (positions.length < 2) {
            console.warn('可见弧段点数不足或存在无效点，已跳过:', ev);
            return;
        }
        let color = Cesium.Color.fromRandom({ alpha: 0.8 });
        viewer.entities.add({
            id: `vis_${ev.station}_${ev.satellite}_${idx}`,
            name: `可见弧段: ${ev.station} - ${ev.satellite}`,
            polyline: { positions, width: 2.5, material: color, clampToGround: false },
            description: `地面站: ${ev.station}, 卫星: ${ev.satellite}`
        });
    });
}

async function loadDataForCesium(viewer) {
    try {
        const [orbitData, visibilityData] = await Promise.all([
            fetch(orbitFile).then(r => r.json()),
            fetch(visibilityFile).then(r => r.json())
        ]);
        // 直接使用 visibilityData.stations 作为地面站数据
        const stationData = visibilityData.stations || [];
        addGroundStations(viewer, stationData);
        addSatelliteOrbits(viewer, orbitData);
        addVisibilityArcs(viewer, visibilityData.events || visibilityData); // 兼容旧结构
        // 设置时间系统
        if (visibilityData.metadata && visibilityData.metadata.start_time && visibilityData.metadata.end_time) {
            const startTime = Cesium.JulianDate.fromDate(new Date(visibilityData.metadata.start_time));
            const endTime = Cesium.JulianDate.fromDate(new Date(visibilityData.metadata.end_time));
            viewer.clock.startTime = startTime;
            viewer.clock.stopTime = endTime;
            viewer.clock.currentTime = startTime;
            viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
            viewer.clock.multiplier = 60; // 1秒=1分钟，可根据需要调整
        }
        // 轨道动态更新
        viewer.clock.onTick.addEventListener(function(clock) {
            const currentDate = Cesium.JulianDate.toDate(clock.currentTime);
            const tailStart = new Date(currentDate.getTime() - 2 * 3600 * 1000); // 2小时尾巴
            Object.keys(satelliteOrbitRawData).forEach(satName => {
                const raw = satelliteOrbitRawData[satName];
                // 只保留2小时内的轨迹
                const tail = raw.filter(p => p.time >= tailStart && p.time <= currentDate);
                if (tail.length >= 2) {
                    satelliteOrbitEntities[satName].polyline.positions = tail.map(p => p.cart3);
                    satelliteOrbitEntities[satName].show = true;
                } else {
                    satelliteOrbitEntities[satName].show = false;
                }
            });
        });
        showStatus(`数据加载完成：${stationData.length}地面站, ${Object.keys(orbitData.satellites).length}卫星, ${(visibilityData.events ? visibilityData.events.length : visibilityData.length)}可见弧段`);
    } catch (e) {
        showStatus('数据加载失败: ' + e.message);
    }
}

function initCesiumViewer() {
    const viewer = new Cesium.Viewer('cesiumContainer', {
        baseLayerPicker: false,
        geocoder: true,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        animation: true,
        timeline: true,
        fullscreenButton: true,
        infoBox: true,
        selectionIndicator: true,
        shadows: false,
        shouldAnimate: true,
        requestRenderMode: false,
        targetFrameRate: 60
    });
    viewer.scene.globe.enableLighting = true;
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000) });
    return viewer;
}

async function initVisualization() {
    if (!document.getElementById('cesiumContainer')) return;
    if (typeof Cesium === 'undefined') { showStatus('Cesium未加载'); return; }
    const viewer = initCesiumViewer();
    await loadDataForCesium(viewer);
    console.log(stationData)
    showStatus('Cesium渲染完成! 支持鼠标拖拽、缩放、点击轨迹。');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
} 
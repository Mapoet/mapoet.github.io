const orbitFile = '/assets/traj/satellite_orbits.json';
const visibilityFile = '/assets/traj/visibility_events.json';
const timePeriod = 2 * 3600; // 2小时
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
let visibilityArcEntities = [];
let visibilityArcRawData = [];

function addSatelliteOrbits(viewer, orbitData) {
    satelliteOrbitEntities = {};
    satelliteOrbitRawData = {};
    orbitTimeList = {};
    Object.keys(orbitData.satellites).forEach(satName => {
        const satellite = orbitData.satellites[satName];
        const validPositions = (satellite.positions || [])
            .filter(pos => isFinite(pos.lon) && isFinite(pos.lat) && isFinite(pos.alt) && pos.time)
            .map(pos => {
                let t = pos.time;
                if (typeof t === 'string') t = new Date(t);
                return {
                    cart3: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000),
                    time: t
                };
            });
        if (validPositions.length < 2) {
            console.warn('轨道点数不足或存在无效点，已跳过:', satName);
            return;
        }
        let color = satellite.type === 'GNSS' ? Cesium.Color.YELLOW.withAlpha(0.7) : Cesium.Color.LIME.withAlpha(0.7);
        // 全部点一次性加上，分配唯一id
        const entity = viewer.entities.add({
            id: `orbit_${satName}`,
            name: `${satellite.type} 轨道 ${satName}`,
            polyline: { positions: validPositions.map(p => p.cart3), width: 1.0, material: color, clampToGround: false }
        });
        satelliteOrbitEntities[satName] = entity;
        satelliteOrbitRawData[satName] = validPositions;
        orbitTimeList[satName] = validPositions.map(p => p.time);
    });
}

function setupTimeSystem(viewer, orbitData, visibilityData) {
    let startTime = null;
    let endTime = null;
    // 优先从visibilityData.metadata获取
    if (visibilityData && visibilityData.metadata) {
        startTime = new Date(visibilityData.metadata.start_time);
        endTime = new Date(visibilityData.metadata.end_time);
    } else if (orbitData && orbitData.metadata) {
        startTime = new Date(orbitData.metadata.start_time);
        endTime = new Date(orbitData.metadata.end_time);
    }
    if (!startTime || !endTime) {
        startTime = new Date();
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    }
    viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime); // 只初始化时设置
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 1;
    viewer.dataStartTime = startTime;
    viewer.dataEndTime = endTime;
    // 启动时间过滤（不再主动设置currentTime）
    startTimeFiltering(viewer);
}

function startTimeFiltering(viewer) {
    viewer.clock.onTick.addEventListener(function(clock) {
        updateVisibleEvents(viewer, viewer.clock.currentTime);
    });
    // 初始更新（不设置currentTime）
    updateVisibleEvents(viewer, viewer.clock.currentTime);
}

function updateVisibleEvents(viewer, currentTime) {
    const currentDate = Cesium.JulianDate.toDate(currentTime);
    const currentTimeMs = currentDate.getTime();
    const tailStartMs = currentTimeMs - timePeriod * 1000; // 时间尾巴
    // 轨道线动态显示/隐藏
    Object.keys(satelliteOrbitRawData).forEach(satName => {
        const raw = satelliteOrbitRawData[satName];
        // 判断轨道是否有点在2小时窗口内
        const hasInWindow = raw.some(p => p.time && p.time.getTime() >= tailStartMs && p.time.getTime() <= currentTimeMs);
        satelliteOrbitEntities[satName].show = hasInWindow;
    });
    // 可视弧段高亮显示/隐藏
    visibilityArcRawData.forEach(({ entity, startTime, endTime }) => {
        const startMs = startTime && startTime.getTime ? startTime.getTime() : null;
        const endMs = endTime && endTime.getTime ? endTime.getTime() : null;
        if (startMs !== null && endMs !== null && !(endMs < tailStartMs || startMs > currentTimeMs)) {
            entity.polyline.show = true;
        } else {
            entity.polyline.show = false;
        }
    });
}

// 修改addVisibilityArcs，存储points到visibilityArcRawData
function addVisibilityArcs(viewer, visibilityData) {
    visibilityArcEntities = [];
    visibilityArcRawData = [];
    (visibilityData || []).forEach((ev, idx) => {
        const points = (ev.points || [])
            .filter(p => isFinite(p.lon) && isFinite(p.lat) && isFinite(p.alt))
            .map(p => {
                let t = p.time;
                if (typeof t === 'string') t = new Date(t);
                return {
                    cart3: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * 1000),
                    time: t
                };
            });
        if (points.length < 2) {
            console.warn('可见弧段点数不足或存在无效点，已跳过:', ev);
            return;
        }
        const startTime = points[0].time;
        const endTime = points[points.length - 1].time;
        // 全部点一次性加上，分配唯一id
        const entity = viewer.entities.add({
            id: `vis_${ev.station}_${ev.satellite}_${idx}`,
            name: `可见弧段: ${ev.station} - ${ev.satellite}`,
            polyline: { positions: points.map(p => p.cart3), width: 4.0, material: Cesium.Color.fromRandom({ alpha: 0.8 }), clampToGround: false, show: false },
            description: `地面站: ${ev.station}, 卫星: ${ev.satellite}`
        });
        visibilityArcEntities.push(entity);
        visibilityArcRawData.push({ entity, startTime, endTime });
    });
}

async function loadDataForCesium(viewer) {
    try {
        const [orbitData, visibilityData] = await Promise.all([
            fetch(orbitFile).then(r => r.json()),
            fetch(visibilityFile).then(r => r.json())
        ]);
        const stationData = visibilityData.stations || [];
        addGroundStations(viewer, stationData);
        addSatelliteOrbits(viewer, orbitData);
        addVisibilityArcs(viewer, visibilityData.events || visibilityData);
        addLegend(viewer);
        setupTimeSystem(viewer, orbitData, visibilityData);

        showStatus(`数据加载完成：${stationData.length}地面站, ${Object.keys(orbitData.satellites).length}卫星, ${(visibilityData.events ? visibilityData.events.length : visibilityData.length)}可见弧段`);
    } catch (e) {
        showStatus('数据加载失败: ' + e.message);
    }
}

function addLegend(viewer) {
    let legend = document.getElementById('cesium-legend');
    if (!legend) {
        legend = document.createElement('div');
        legend.id = 'cesium-legend';
        legend.style.position = 'absolute';
        legend.style.top = '10px';
        legend.style.right = '10px';
        legend.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        legend.style.color = 'white';
        legend.style.padding = '12px';
        legend.style.borderRadius = '6px';
        legend.style.fontSize = '12px';
        legend.style.fontFamily = 'Arial, sans-serif';
        legend.style.zIndex = '1000';
        legend.style.minWidth = '220px';
        legend.innerHTML = `
            <div style="margin-bottom: 8px; font-weight: bold; text-align: center;">轨道与可视弧段图例</div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 2px; background-color: yellow; margin-right: 8px;"></div>
                <span>GNSS卫星轨道（细线）</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 2px; background-color: lime; margin-right: 8px;"></div>
                <span>LEO卫星轨道（细线）</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 4px; background-color: orange; margin-right: 8px;"></div>
                <span>高亮可视弧段（粗线）</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 10px; height: 10px; background-color: red; border-radius: 50%; margin-right: 8px;"></div>
                <span>地面站</span>
            </div>
            <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 10px; opacity: 0.9;">
                <div style="font-weight: bold; margin-bottom: 4px;">快捷键说明：</div>
                <div>F = 全屏切换</div>
                <div>H = 主页视角</div>
                <div>L = 图例显示/隐藏</div>
            </div>
            <div style="font-size: 10px; margin-top: 6px; opacity: 0.8; text-align: center;">
                操作: 鼠标拖拽旋转 | 滚轮缩放 | 双击定位 | 点击轨迹显示编号
            </div>
        `;
        document.getElementById('cesiumContainer').appendChild(legend);
    } else {
        legend.style.display = 'block';
    }
}

function setupKeyboardShortcuts(viewer) {
    document.addEventListener('keydown', function(event) {
        let message = '';
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        switch(event.key.toLowerCase()) {
            case 'f':
                event.preventDefault();
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    message = '退出全屏模式';
                } else {
                    document.getElementById('cesiumContainer').requestFullscreen();
                    message = '进入全屏模式';
                }
                break;
            case 'h':
                event.preventDefault();
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
                    orientation: {
                        heading: 0.0,
                        pitch: -Cesium.Math.PI_OVER_TWO,
                        roll: 0.0
                    },
                    duration: 2.0
                });
                message = '回到主页视角';
                break;
            case 'l':
                event.preventDefault();
                let legend = document.getElementById('cesium-legend');
                if (legend) {
                    legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
                    message = `图例显示: ${legend.style.display === 'none' ? '关闭' : '开启'}`;
                }
                break;
        }
        if (message) {
            showStatus(message);
            setTimeout(() => {
                showStatus('Cesium渲染完成! 支持鼠标拖拽、缩放、点击轨迹。');
            }, 3000);
        }
    });
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
    setupKeyboardShortcuts(viewer);
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
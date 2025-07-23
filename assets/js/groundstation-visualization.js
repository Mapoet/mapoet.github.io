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
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(st.lon, st.lat, st.alt * 1000),
            point: { pixelSize: 7, color: Cesium.Color.RED },
            label: { text: st.name || st.station || st["EN-Name"] || st["name"], font: '10pt sans-serif', fillColor: Cesium.Color.WHITE, show: true, pixelOffset: new Cesium.Cartesian2(0, -18) }
        });
    });
}

function addSatelliteOrbits(viewer, orbitData) {
    Object.keys(orbitData.satellites).forEach(satName => {
        const satellite = orbitData.satellites[satName];
        const positions = satellite.positions.map(pos => Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000));
        let color = satellite.type === 'GNSS' ? Cesium.Color.YELLOW.withAlpha(0.7) : Cesium.Color.LIME.withAlpha(0.7);
        viewer.entities.add({
            id: `orbit_${satName}`,
            name: `${satellite.type} 轨道 ${satName}`,
            polyline: { positions, width: 1.5, material: color, clampToGround: false }
        });
    });
}

function addVisibilityArcs(viewer, visibilityData) {
    visibilityData.forEach((ev, idx) => {
        const positions = ev.points.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * 1000));
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
    showStatus('Cesium渲染完成! 支持鼠标拖拽、缩放、点击轨迹。');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
} 
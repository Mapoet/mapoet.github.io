const orbitFile = '/assets/traj/satellite_orbits.json';
const visibilityFile = '/assets/traj/visibility_events.json';
const timePeriod = 2 * 3600; // 2小时
const statusDiv = document.getElementById('status');
let showLEO=true;
let showGNSS=true;

// 设置Cesium Ion访问令牌 - 使用用户申请的token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzOTZhYjUxMy0yM2RhLTQzYTQtYjVmNy1hNTI1NjZiNGI5NDgiLCJpZCI6MzIyODkzLCJpYXQiOjE3NTI4ODExMTd9.ZW3143EaO-0r7H7Tr9Q0rfboNl2FjBWUzm2JgcEKj5g';


function showStatus(message) {
    statusDiv.innerHTML = message;
}
// 移除 parseStationData 函数

function addGroundStations(viewer, stations) {
    viewer.groundStations = stations;
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


function addSatelliteOrbits(viewer, orbitData) {
    // 存储卫星轨道数据
    viewer.satelliteOrbits = orbitData;

    let navCount = 0;
    let leoCount = 0;
    // 遍历卫星轨道数据
    Object.keys(orbitData.satellites).forEach((satName, satIndex) => {
        const satellite = orbitData.satellites[satName];
        const validPositions = (satellite.positions || [])
            .filter(pos => isFinite(pos.lon) && isFinite(pos.lat) && isFinite(pos.alt) && pos.time)
            .map(pos => {
                let t = pos.time;
                if (typeof t === 'string') t = new Date(t);
                return {
                    lon: pos.lon,
                    lat: pos.lat,
                    alt: pos.alt,
                    time: t
                };
            });
        if (validPositions.length < 2) {
            console.warn('轨道点数不足或存在无效点，已跳过:', satName);
            return;
        }
        let lineColor, lineMaterial, pointColor;
        if (satellite.type === 'GNSS') {
            lineColor = Cesium.Color.YELLOW;
            lineMaterial = Cesium.Color.YELLOW.withAlpha(0.6);
            pointColor = Cesium.Color.YELLOW;
            navCount++;
        } else {
            lineColor = Cesium.Color.LIME;
            lineMaterial = Cesium.Color.LIME.withAlpha(0.6);
            pointColor = Cesium.Color.LIME;
            leoCount++;
        }
        // 轨道线
        const orbitLine = viewer.entities.add({
            id: `orbit_${satName}_line`,
            name: `${satellite.type} 轨道 ${satName}`,
            polyline: {
                positions: validPositions.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * 1000)),
                width: 1.0,
                material: lineMaterial,
                clampToGround: false,
                zIndex: 1000,
                shadows: Cesium.ShadowMode.ENABLED
            }
        });
        // 当前点
        const currentPoint = viewer.entities.add({
            id: `orbit_${satName}_current`,
            position: Cesium.Cartesian3.fromDegrees(validPositions[validPositions.length - 1].lon, validPositions[validPositions.length - 1].lat, validPositions[validPositions.length - 1].alt * 1000),
            point: {
                pixelSize: 2,
                color: pointColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: satName,
                font: '9pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -15),
                heightReference: Cesium.HeightReference.NONE,
                show: false
            }
        });
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
    const timeWindow = timePeriod * 1000;
    const timeAgo = new Date(currentDate.getTime() - timeWindow);
    const timeAhead = new Date(currentDate.getTime());

    // 只隐藏/显示轨道和弧段相关实体，地面站point不受影响
    viewer.entities.values.forEach(function(entity) {
        if ((entity.polyline || entity.point) && entity.id && (entity.id.startsWith('orbit_') || entity.id.startsWith('vis_'))) {
            entity.show = false;
        }
    });

    let visibleEvents = 0;
    let visibleOrbits = 0;

    // 可视弧段显示
    if (viewer.visibilityArcs) {
        viewer.visibilityArcs.forEach((ev, idx) => {
            const points = (ev.points || [])
                .filter(p => isFinite(p.lon) && isFinite(p.lat) && isFinite(p.alt))
                .map(p => {
                    let t = p.time;
                    if (typeof t === 'string') t = new Date(t);
                    return { lon: p.lon, lat: p.lat, alt: p.alt, time: t };
                });
            if (points.length < 2) return;
            const startTime = points[0].time;
            const endTime = points[points.length - 1].time;
            if (startTime <= timeAhead && endTime >= timeAgo) {
                const entityLine = viewer.entities.getById(`vis_${ev.station}_${ev.satellite}_${idx}_line`);
                const entityStart = viewer.entities.getById(`vis_${ev.station}_${ev.satellite}_${idx}_start`);
                const entityEnd = viewer.entities.getById(`vis_${ev.station}_${ev.satellite}_${idx}_end`);
                if (entityLine) { entityLine.show = true; visibleEvents++; }
                if (entityStart) entityStart.show = true;
                if (entityEnd) entityEnd.show = true;
            }
        });
    }

    // 轨道显示
    if (viewer.satelliteOrbits) {
        Object.keys(viewer.satelliteOrbits.satellites).forEach(satName => {
            const satellite = viewer.satelliteOrbits.satellites[satName];
            const visiblePositions = (satellite.positions || []).filter(pos => {
                const posTime = new Date(pos.time);
                return posTime >= timeAgo && posTime <= timeAhead;
            });
            if (visiblePositions.length > 1) {
                const orbitLine = viewer.entities.getById(`orbit_${satName}_line`);
                if (orbitLine) {
                    const positions = visiblePositions.map(pos => Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000));
                    orbitLine.polyline.positions = new Cesium.CallbackProperty(() => positions, false);
                    orbitLine.show = true;
                    visibleOrbits++;
                }
                const currentPoint = viewer.entities.getById(`orbit_${satName}_current`);
                if (currentPoint && visiblePositions.length > 0) {
                    const lastPos = visiblePositions[visiblePositions.length - 1];
                    currentPoint.position = Cesium.Cartesian3.fromDegrees(lastPos.lon, lastPos.lat, lastPos.alt * 1000);
                    currentPoint.show = true;
                }
            }
        });
    }

    // 更新状态显示
    const timeStr = currentDate.toISOString().replace('T', ' ').substring(0, 19);
    showStatus(`当前时间: ${timeStr}, 显示事件: ${visibleEvents}个, 卫星: ${visibleOrbits}个 (时间窗口: ${timePeriod/3600}小时)`);
}

// 修改addVisibilityArcs，存储points到visibilityArcRawData
function addVisibilityArcs(viewer, visibilityData) {
    // 存储可见弧段数据
    viewer.visibilityArcs = visibilityData;
    // 遍历可见弧段数据
    (visibilityData || []).forEach((ev, idx) => {
        const points = (ev.points || [])
            .filter(p => isFinite(p.lon) && isFinite(p.lat) && isFinite(p.alt))
            .map(p => {
                let t = p.time;
                if (typeof t === 'string') t = new Date(t);
                return {
                    lon: p.lon,
                    lat: p.lat,
                    alt: p.alt,
                    time: t
                };
            });
        if (points.length < 2) {
            console.warn('可见弧段点数不足或存在无效点，已跳过:', ev);
            return;
        }
        const positions = points.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * 1000));
        const startTime = points[0].time;
        const endTime = points[points.length - 1].time;
        // 轨迹线
        const polyline = viewer.entities.add({
            id: `vis_${ev.station}_${ev.satellite}_${idx}_line`,
            name: `可见弧段: ${ev.station} - ${ev.satellite}`,
            polyline: {
                positions: positions,
                width: 4.0,
                material: Cesium.Color.fromRandom({ alpha: 0.8 }),
                clampToGround: false,
                zIndex: 1000,
                shadows: Cesium.ShadowMode.ENABLED
            },
            description: `地面站: ${ev.station}, 卫星: ${ev.satellite}`,
            _arcStartTime: startTime,
            _arcEndTime: endTime
        });
        // 起点
        const startPoint = viewer.entities.add({
            id: `vis_${ev.station}_${ev.satellite}_${idx}_start`,
            position: positions[0],
            point: {
                pixelSize: 2,
                color: Cesium.Color.ORANGE,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${ev.station}-${ev.satellite}`,
                font: '8pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -12),
                heightReference: Cesium.HeightReference.NONE,
                show: false
            }
        });
        // 终点
        const endPoint = viewer.entities.add({
            id: `vis_${ev.station}_${ev.satellite}_${idx}_end`,
            position: positions[positions.length - 1],
            point: {
                pixelSize: 2,
                color: Cesium.Color.ORANGE,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${ev.station}-${ev.satellite}`,
                font: '8pt sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -12),
                heightReference: Cesium.HeightReference.NONE,
                show: false
            }
        });
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
                <div>A = 图例显示/隐藏</div>
                <div>L = 低轨卫星显示/隐藏</div>
                <div>G = 导航卫星显示/隐藏</div>
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
            case 'a':
                event.preventDefault();
                let legend = document.getElementById('cesium-legend');
                if (legend) {
                    legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
                    message = `图例显示: ${legend.style.display === 'none' ? '关闭' : '开启'}`;
                }
                break;
            case 'l': // 切换低轨卫星
                showLEO = !showLEO;
                viewer.entities.values.forEach(function(entity) {
                    if (entity.id && entity.id.includes('_line') && entity.name && entity.name.includes('LEO')) {
                        entity.show = showLEO;
                    }
                    if (entity.id && entity.id.includes('_current') && entity.name && entity.name.includes('LEO')) {
                        entity.show = showLEO;
                    }
                });
                message = `低轨卫星显示: ${showLEO ? '开启' : '关闭'}`;
                break;
            case 'g': // 切换导航卫星
                showGNSS = !showGNSS;
                viewer.entities.values.forEach(function(entity) {
                    if (entity.id && entity.id.includes('_line') && entity.name && entity.name.includes('GNSS')) {
                        entity.show = showGNSS;
                    }
                    if (entity.id && entity.id.includes('_current') && entity.name && entity.name.includes('GNSS')) {
                        entity.show = showGNSS;
                    }
                });
                message = `导航卫星显示: ${showGNSS ? '开启' : '关闭'}`;
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
    // 添加点击事件处理
    viewer.screenSpaceEventHandler.setInputAction(function(click) {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
            const entity = pickedObject.id;
            // 隐藏所有标签
            viewer.entities.values.forEach(function(e) {
                if (e.label) {
                    e.label.show = false;
                }
            });
            if (entity && entity.id) {
                if (entity.id.startsWith('vis_')) {
                    // 处理可视弧段点击
                    const parts = entity.id.split('_');
                    const arcId = `vis_${parts[1]}_${parts[2]}_${parts[3]}`;
                    const startEntity = viewer.entities.getById(`${arcId}_start`);
                    const endEntity = viewer.entities.getById(`${arcId}_end`);
                    if (startEntity && startEntity.label) {
                        startEntity.label.show = true;
                    }
                    if (endEntity && endEntity.label) {
                        endEntity.label.show = true;
                    }
                } else if (entity.id.startsWith('orbit_')) {
                    // 处理卫星轨道点击
                    const satName = entity.id.split('_')[1];
                    const currentEntity = viewer.entities.getById(`orbit_${satName}_current`);
                    if (currentEntity && currentEntity.label) {
                        currentEntity.label.show = true;
                    }
                }
            }
        } else {
            // 点击空白区域，隐藏所有标签
            viewer.entities.values.forEach(function(e) {
                if (e.label) {
                    e.label.show = false;
                }
            });
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 添加双击事件处理：飞到卫星或地面站视角
    viewer.screenSpaceEventHandler.setInputAction(function(click) {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
            const entity = pickedObject.id;
            if (entity && entity.position) {
                // 卫星当前点
                if (entity.id && entity.id.startsWith('orbit_') && entity.id.endsWith('_current')) {
                    viewer.camera.flyTo({
                        destination: entity.position.getValue(viewer.clock.currentTime),
                        duration: 2.0
                    });
                }
                // 地面站
                else if (entity.point && entity.label) {
                    viewer.camera.flyTo({
                        destination: entity.position.getValue(viewer.clock.currentTime),
                        duration: 2.0
                    });
                }
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    
    showStatus('Cesium渲染完成! 支持鼠标拖拽、缩放、点击轨迹。');
    // 启动文件更新监测
    startFileMonitoring(viewer);
    console.log(stationData)
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
} 
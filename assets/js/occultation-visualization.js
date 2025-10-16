const eventFile = '/assets/traj/occultation_events.json';
const orbitFile = '/assets/traj/satellite_orbits.json';
const statusDiv = document.getElementById('status');
const timePeriod = 60 * 60; // 数据时间窗口长度（秒）

// 文件更新监测相关变量
let lastEventFileTime = 0;
let lastOrbitFileTime = 0;
let fileCheckInterval = null;
let currentViewer = null;

// 设置Cesium Ion访问令牌 - 使用用户申请的token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzOTZhYjUxMy0yM2RhLTQzYTQtYjVmNy1hNTI1NjZiNGI5NDgiLCJpZCI6MzIyODkzLCJpYXQiOjE3NTI4ODExMTd9.ZW3143EaO-0r7H7Tr9Q0rfboNl2FjBWUzm2JgcEKj5g';

function getColor(type) {
    if (type === 'iono') return Cesium.Color.CYAN;
    if (type === 'atm') return Cesium.Color.ORANGE;
    return Cesium.Color.GRAY;
}

function showStatus(message) {
    statusDiv.innerHTML = message;
    //console.log(message);
}

// 检查Cesium是否可用
function checkCesium() {
    showStatus('检查Cesium库...');
    
    if (typeof Cesium === 'undefined') {
        showStatus('错误：Cesium 库未正确加载');
        return false;
    }
    
    //console.log('Cesium版本:', Cesium.VERSION);
    //console.log('Cesium对象:', Cesium);
    
    showStatus('Cesium库已加载，正在初始化地球...');
    return true;
}

// 检查DOM元素
function checkDOM() {
    const container = document.getElementById('cesiumContainer');
    if (!container) {
        showStatus('错误：找不到 #cesiumContainer 元素');
        return false;
    }
    
    const statusDiv = document.getElementById('status');
    if (!statusDiv) {
        showStatus('错误：找不到 #status 元素');
        return false;
    }
    
    return true;
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
            // 可按需补充L/T/S/1/0/K等快捷键
        }
        if (message) {
            showStatus(message);
            setTimeout(() => {
                showStatus('Cesium渲染完成!支持鼠标拖拽、滚轮缩放、双击定位。');
            }, 3000);
        }
    });
}

function initCesiumViewer() {
    // 创建Cesium Viewer - 使用最简配置确保地球显示
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
    // 同步地球显示参数
    const scene = viewer.scene;
    scene.globe.enableLighting = true;
    scene.globe.showGroundAtmosphere = true;
    if ('atmosphereLighting' in scene.globe) scene.globe.atmosphereLighting = false;
    if ('atmosphereLightingIntensity' in scene.globe) scene.globe.atmosphereLightingIntensity = 1.0;
    if ('atmosphereHueShift' in scene.globe) scene.globe.atmosphereHueShift = 0.0;
    if ('atmosphereSaturationShift' in scene.globe) scene.globe.atmosphereSaturationShift = 0.0;
    if ('atmosphereBrightnessShift' in scene.globe) scene.globe.atmosphereBrightnessShift = 0.0;
    if ('atmosphereAlpha' in scene.globe) scene.globe.atmosphereAlpha = 0.5;
    if ('nightFadeInDistance' in scene.globe) scene.globe.nightFadeInDistance = 2000000;
    if ('nightFadeOutDistance' in scene.globe) scene.globe.nightFadeOutDistance = 1000000;
    if ('dynamicAtmosphereLighting' in scene.globe) scene.globe.dynamicAtmosphereLighting = false;
    if ('dynamicAtmosphereLightingFromSun' in scene.globe) scene.globe.dynamicAtmosphereLightingFromSun = false;
    try {
        const worldTerrain = Cesium.createWorldTerrain();
        viewer.terrainProvider = worldTerrain;
    } catch (terrainError) {
        console.error('地形添加失败:', terrainError);
    }
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
        orientation: {
            heading: 0.0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0.0
        }
    });
    scene.requestRender();
    setupKeyboardShortcuts(viewer);
    return viewer;
}

// 生成掩星事件标签
function generateOccultationLabel(event, index) {
    try {
        // 从事件数据中提取时间信息
        let eventTime = null;
        const timeFields = ['time', 'timestamp', 'date', 'datetime', 'start_time', 'event_time'];
        for (const field of timeFields) {
            if (event[field]) {
                eventTime = new Date(event[field]);
                break;
            }
        }
        
        // 如果没有时间信息，使用当前时间
        if (!eventTime) {
            eventTime = new Date();
        }
        
        // 计算年积日 (Day of Year)
        const year = eventTime.getUTCFullYear();
        const startOfYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((eventTime - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        
        // 获取UTC时分
        const hour = eventTime.getUTCHours().toString().padStart(2, '0');
        const minute = eventTime.getUTCMinutes().toString().padStart(2, '0');
        
        // 获取卫星名称
        const leoName = event.leo || 'LEO';
        const gnssName = event.nav || 'GNSS';
        
        // 生成标签
        const prefix = event.type === 'iono' ? 'ionPrf' : 'atmPrf';
        const label = `${prefix}_${leoName}.${year}.${dayOfYear.toString().padStart(3, '0')}.${hour}.${minute}.${gnssName}_0001.0001_nc`;
        
        return label;
    } catch (error) {
        console.error('生成掩星标签失败:', error);
        // 如果生成失败，返回默认标签
        return `${event.type === 'iono' ? 'I' : 'A'}${index + 1}`;
    }
}

// 添加掩星轨迹到Cesium
function addOccultationTrajectories(viewer, data) {
    //console.log('添加掩星轨迹到Cesium...');
    
    //const testData = data.slice(0, 100); // 显示前100个事件
    const testData = data; // 显示所有事件
    let validEvents = 0;
    let ionoCount = 0;
    let atmCount = 0;
    
    // 存储所有事件数据用于时间过滤
    viewer.occultationEvents = testData;
    
    testData.forEach((event, index) => {
        if (!event.points || event.points.length < 2) {
            //console.log(`事件 ${index} 点数不足，跳过`);
            return;
        }
        
        //console.log(`事件 ${index} (${event.type}): ${event.points.length}个点`);
        
        // 转换坐标并检查高度
        const positions = event.points.map(point => {
            let height = point.alt;
            
            return Cesium.Cartesian3.fromDegrees(point.lon, point.lat, height * 1000);
        });
        
        // 根据事件类型设置颜色
        let lineColor, lineMaterial;
        if (event.type === 'iono') {
            lineColor = Cesium.Color.CYAN;
            lineMaterial = Cesium.Color.CYAN.withAlpha(0.8); // 增加不透明度
            ionoCount++;
        } else if (event.type === 'atm') {
            lineColor = Cesium.Color.ORANGE;
            lineMaterial = Cesium.Color.ORANGE.withAlpha(0.8); // 增加不透明度
            atmCount++;
        } else {
            lineColor = Cesium.Color.GRAY;
            lineMaterial = Cesium.Color.GRAY.withAlpha(0.8); // 增加不透明度
        }
        
        // 生成掩星事件标签
        const eventLabel = generateOccultationLabel(event, index);
        
        // 添加轨迹线 - 增加线宽和透明度
        const polyline = viewer.entities.add({
            id: `event_${index}_line`,
            name: `${event.type} 掩星轨迹 ${index + 1}`,
            polyline: {
                positions: positions,
                width: 1.0, // 增加线宽，使轨迹更明显
                material: lineMaterial,
                clampToGround: false,
                zIndex: 1000,
                shadows: Cesium.ShadowMode.ENABLED // 启用阴影
            }
        });
        
        // 添加起点标记和标签 - 更小的点
        const startPoint = viewer.entities.add({
            id: `event_${index}_start`,
            position: positions[0],
            point: {
                pixelSize: 1.5, // 减小点大小
                color: lineColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 0.5, // 减小轮廓宽度
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: eventLabel,
                font: '7pt sans-serif', // 减小字体以适应更长的标签
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -12), // 减小偏移
                heightReference: Cesium.HeightReference.NONE,
                show: false // 默认隐藏标签
            }
        });
        
        // 添加终点标记和标签 - 更小的点
        const endPoint = viewer.entities.add({
            id: `event_${index}_end`,
            position: positions[positions.length - 1],
            point: {
                pixelSize: 1.5, // 减小点大小
                color: lineColor,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 0.5, // 减小轮廓宽度
                heightReference: Cesium.HeightReference.NONE
            },
            label: {
                text: `${event.type === 'iono' ? 'I' : 'A'}${index + 1}`,
                font: '8pt sans-serif', // 减小字体
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -12), // 减小偏移
                heightReference: Cesium.HeightReference.NONE,
                show: false // 默认隐藏标签
            }
        });
        
        // 添加点击事件处理
        startPoint.point.id = `event_${index}`;
        endPoint.point.id = `event_${index}`;
        polyline.polyline.id = `event_${index}`;
        
        validEvents++;
    });
    
    //console.log(`统计: 电离层掩星 ${ionoCount} 条, 大气掩星 ${atmCount} 条`);
    return { total: validEvents, iono: ionoCount, atm: atmCount };
}

// 添加卫星轨道到Cesium
function addSatelliteOrbits(viewer, orbitData) {
    //console.log('添加卫星轨道到Cesium...');
    
    // 存储轨道数据用于时间过滤
    viewer.satelliteOrbits = orbitData;
    
    let navCount = 0;
    let leoCount = 0;
    
    // 为每个卫星创建轨道实体
    Object.keys(orbitData.satellites).forEach((satName, satIndex) => {
        const satellite = orbitData.satellites[satName];
        const positions = satellite.positions.map(pos => {
            return Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000);
        });
        
        // 根据卫星类型设置颜色
        let lineColor, lineMaterial, pointColor;
        if (satellite.type === 'GNSS') {
            lineColor = Cesium.Color.YELLOW;
            lineMaterial = Cesium.Color.YELLOW.withAlpha(0.6); // 增加不透明度
            pointColor = Cesium.Color.YELLOW;
            navCount++;
        } else {
            lineColor = Cesium.Color.LIME;
            lineMaterial = Cesium.Color.LIME.withAlpha(0.6); // 增加不透明度
            pointColor = Cesium.Color.LIME;
            leoCount++;
        }
        
        // 添加轨道线 - 使用更粗的线条和更高的透明度
        const orbitLine = viewer.entities.add({
            id: `orbit_${satName}_line`,
            name: `${satellite.type} 轨道 ${satName}`,
            polyline: {
                positions: positions,
                width: 1.0, // 增加线宽
                material: lineMaterial,
                clampToGround: false,
                zIndex: 1000, // 轨道线在掩星轨迹上方
                shadows: Cesium.ShadowMode.ENABLED
            }
        });
        
        // 添加卫星当前位置点
        const currentPoint = viewer.entities.add({
            id: `orbit_${satName}_current`,
            position: positions[positions.length - 1], // 最后一个位置作为当前位置
            point: {
                pixelSize: 2, // 卫星点稍大一些
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
                show: false // 默认隐藏标签
            }
        });
        
        // 添加点击事件处理
        currentPoint.point.id = `orbit_${satName}`;
        orbitLine.polyline.id = `orbit_${satName}`;
    });
    
    //console.log(`统计: 导航卫星 ${navCount} 个, 低轨卫星 ${leoCount} 个`);
    return { nav: navCount, leo: leoCount };
}

// 设置时间系统
function setupTimeSystem(viewer, eventData, orbitData) {
    // 尝试从数据中提取时间信息
    let startTime = null;
    let endTime = null;
    
    // 优先从轨道数据中获取时间范围
    if (orbitData && orbitData.metadata) {
        startTime = new Date(orbitData.metadata.start_time);
        endTime = new Date(orbitData.metadata.end_time);
        console.log('从轨道数据获取时间范围');
    }
    // 如果没有轨道数据，尝试从掩星事件数据中获取
    else if (eventData && eventData.length > 0) {
        const firstEvent = eventData[0];
        const lastEvent = eventData[eventData.length - 1];
        // 检查常见的时间字段名
        const timeFields = ['time', 'timestamp', 'date', 'datetime', 'start_time', 'event_time'];
        
        for (const field of timeFields) {
            if (firstEvent[field]) {
                startTime = new Date(firstEvent[field]);
                endTime = new Date(lastEvent[field]);
                break;
            }
        }
        
        // 如果没有找到时间字段，使用当前时间
        if (!startTime) {
            startTime = new Date();
            // 设置结束时间为开始时间后24小时
            endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
            console.log('未找到数据时间字段，使用当前时间');
        }
        
    } else {
        // 如果没有数据，使用当前时间
        startTime = new Date();
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    }
    
    // 设置Cesium时钟
    viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 1; // 1秒 = 1秒，正常时间流动
    
    // 存储时间信息
    viewer.dataStartTime = startTime;
    viewer.dataEndTime = endTime;
    
    console.log(`时间系统设置: 开始时间 ${startTime.toISOString()}, 结束时间 ${endTime.toISOString()}`);
    
    // 启动时间过滤
    startTimeFiltering(viewer);
}

// 启动时间过滤
function startTimeFiltering(viewer) {
    // 监听时间变化
    viewer.clock.onTick.addEventListener(function(clock) {
        updateVisibleEvents(viewer, clock.currentTime);
    });
    
    // 初始更新
    updateVisibleEvents(viewer, viewer.clock.currentTime);
}

// 检查文件更新
async function checkFileUpdates() {
    try {
        // 检查事件文件
        const eventResponse = await fetch(eventFile, { method: 'HEAD' });
        if (eventResponse.ok) {
            const eventLastModified = new Date(eventResponse.headers.get('last-modified')).getTime();
            if (eventLastModified > lastEventFileTime) {
                console.log('检测到事件文件更新，重新加载数据...');
                lastEventFileTime = eventLastModified;
                await reloadData(currentViewer);
                return;
            }
        }
        
        // 检查轨道文件
        const orbitResponse = await fetch(orbitFile, { method: 'HEAD' });
        if (orbitResponse.ok) {
            const orbitLastModified = new Date(orbitResponse.headers.get('last-modified')).getTime();
            if (orbitLastModified > lastOrbitFileTime) {
                console.log('检测到轨道文件更新，重新加载数据...');
                lastOrbitFileTime = orbitLastModified;
                await reloadData(currentViewer);
                return;
            }
        }
    } catch (error) {
        console.error('文件更新检查失败:', error);
    }
}

// 重新加载数据
async function reloadData(viewer) {
    if (!viewer) return;
    
    try {
        showStatus('检测到数据更新，正在重新加载...');
        
        // 清除现有实体
        viewer.entities.removeAll();
        
        // 重新加载数据
        await loadDataForCesium(viewer);
        
        showStatus('数据重新加载完成');
    } catch (error) {
        console.error('数据重新加载失败:', error);
        showStatus('数据重新加载失败: ' + error.message);
    }
}

// 启动文件更新监测
function startFileMonitoring(viewer) {
    currentViewer = viewer;
    
    // 获取初始文件时间
    fetch(eventFile, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                lastEventFileTime = new Date(response.headers.get('last-modified')).getTime();
            }
        })
        .catch(error => console.error('获取事件文件时间失败:', error));
    
    fetch(orbitFile, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                lastOrbitFileTime = new Date(response.headers.get('last-modified')).getTime();
            }
        })
        .catch(error => console.error('获取轨道文件时间失败:', error));
    
    // 每30秒检查一次文件更新
    fileCheckInterval = setInterval(checkFileUpdates, 30000);
    
    console.log('文件更新监测已启动，每30秒检查一次');
}

// 更新可见事件
function updateVisibleEvents(viewer, currentTime) {
    // 如果处于调试模式，跳过时间过滤
    if (viewer.showAllData) {
        return;
    }
    
    const currentDate = Cesium.JulianDate.toDate(currentTime);
    
    // 扩大时间窗口，显示更多数据
    const timeWindow = timePeriod * 1000; // 时间窗口
    const timeAgo = new Date(currentDate.getTime() - timeWindow);
    const timeAhead = new Date(currentDate.getTime()); // 也显示未来数据
    
    // 隐藏所有实体
    viewer.entities.values.forEach(function(entity) {
        if (entity.polyline || entity.point) {
            entity.show = false;
        }
    });
    
    let visibleEvents = 0;
    let visibleOrbits = 0;
    
    // 显示时间窗口内的掩星事件
    if (viewer.occultationEvents) {
        viewer.occultationEvents.forEach((event, index) => {
            let eventTime = null;
            
            // 尝试从事件数据中提取时间信息
            const timeFields = ['time', 'timestamp', 'date', 'datetime', 'start_time', 'event_time'];
            for (const field of timeFields) {
                if (event[field]) {
                    eventTime = new Date(event[field]);
                    break;
                }
            }
            
            // 如果没有时间信息，使用索引作为时间（模拟时间分布）
            if (!eventTime) {
                // 假设数据按时间顺序排列，使用索引创建模拟时间
                const timeSpan = viewer.dataEndTime.getTime() - viewer.dataStartTime.getTime();
                const timeStep = timeSpan / viewer.occultationEvents.length;
                eventTime = new Date(viewer.dataStartTime.getTime() + index * timeStep);
            }
            
            // 检查事件是否在时间窗口内
            if (eventTime >= timeAgo && eventTime <= timeAhead) {
                const entityStart = viewer.entities.getById(`event_${index}_start`);
                const entityEnd = viewer.entities.getById(`event_${index}_end`);
                const entityLine = viewer.entities.getById(`event_${index}_line`);
                
                if (entityStart) {
                    entityStart.show = true;
                    visibleEvents++;
                }
                if (entityEnd) {
                    entityEnd.show = true;
                    visibleEvents++;
                }
                if (entityLine) {
                    entityLine.show = true;
                    visibleEvents++;
                }
            }
        });
    }
    
    // 显示时间窗口内的卫星轨道
    if (viewer.satelliteOrbits) {
        Object.keys(viewer.satelliteOrbits.satellites).forEach(satName => {
            const satellite = viewer.satelliteOrbits.satellites[satName];
            
            // 过滤时间窗口内的轨道点
            const visiblePositions = satellite.positions.filter(pos => {
                const posTime = new Date(pos.time);
                return posTime >= timeAgo && posTime <= timeAhead;
            });
            
            if (visiblePositions.length > 1) {
                // 更新轨道线位置 - 使用更安全的方式
                const orbitLine = viewer.entities.getById(`orbit_${satName}_line`);
                if (orbitLine) {
                    const positions = visiblePositions.map(pos => {
                        return Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt * 1000);
                    });
                    
                    // 使用 setValue 方法更新位置
                    orbitLine.polyline.positions = new Cesium.CallbackProperty(() => {
                        return positions;
                    }, false);
                    
                    orbitLine.show = true;
                    visibleOrbits++;
                }
                
                // 更新卫星当前位置
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
    showStatus(`当前时间: ${timeStr}, 显示事件: ${Math.floor(visibleEvents/3)}个, 卫星: ${visibleOrbits}个 (时间窗口: 1小时)`);
}

// 添加图例
function addLegend(viewer, stats, orbitStats) {
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
            <div style="margin-bottom: 8px; font-weight: bold; text-align: center;">掩星轨迹与卫星轨道图例</div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 3px; background-color: cyan; margin-right: 8px;"></div>
                <span>电离层掩星 (${stats.iono}条)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 3px; background-color: orange; margin-right: 8px;"></div>
                <span>大气掩星 (${stats.atm}条)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 3px; background-color: yellow; margin-right: 8px;"></div>
                <span>导航卫星轨道 (${orbitStats.nav}个)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <div style="width: 20px; height: 3px; background-color: lime; margin-right: 8px;"></div>
                <span>低轨卫星轨道 (${orbitStats.leo}个)</span>
            </div>
            <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 10px; opacity: 0.9;">
                <div>标记说明:</div>
                <div>ionPrf_* = 电离层掩星起点/终点</div>
                <div>atmPrf_* = 大气掩星起点/终点</div>
                <div>黄点 = 导航卫星当前位置</div>
                <div>绿点 = 低轨卫星当前位置</div>
            </div>
            <div style="font-size: 10px; margin-top: 6px; opacity: 0.8; text-align: center;">
                操作: 鼠标拖拽旋转 | 滚轮缩放 | 双击定位 | 点击轨迹显示编号
            </div>
            <div style="border-top: 1px solid #555; margin: 8px 0; padding-top: 6px; font-size: 9px; opacity: 0.8;">
                <div style="font-weight: bold; margin-bottom: 4px;">快捷键:</div>
                <div>F = 全屏切换 | H = 主页视角 | L = 图例显示/隐藏</div>
            </div>
        `;
        document.getElementById('cesiumContainer').appendChild(legend);
    } else {
        legend.style.display = 'block';
    }
}

// 主函数
async function initVisualization() {
    //console.log('开始初始化Cesium可视化...');
    
    if (!checkDOM()) {
        //console.log('DOM检查失败');
        return;
    }
    
    if (!checkCesium()) {
        //console.log('Cesium检查失败');
        return;
    }
    
    try {
        // 初始化Cesium Viewer
        const viewer = initCesiumViewer();
        //console.log('Cesium Viewer初始化成功');
        
        // 加载数据
        await loadDataForCesium(viewer);
        
    } catch (error) {
        showStatus(`Cesium初始化失败: ${error.message}`);
        console.error('Cesium初始化错误:', error);
    }
}

async function loadDataForCesium(viewer) {
    //console.log('开始加载数据用于Cesium...');
    
    try {
        // 同时加载掩星事件和卫星轨道数据
        const [eventData, orbitData] = await Promise.all([
            fetch(eventFile).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            }),
            fetch(orbitFile).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
        ]);
        
        //console.log('Cesium数据加载成功:', eventData.length, '个事件,', Object.keys(orbitData.satellites).length, '个卫星');
        showStatus(`数据加载成功，共 ${eventData.length} 个事件, ${Object.keys(orbitData.satellites).length} 个卫星`);
        
        // 解析数据时间并设置Cesium时间
        setupTimeSystem(viewer, eventData, orbitData);
        
        // 添加掩星轨迹
        const eventStats = addOccultationTrajectories(viewer, eventData);
        
        // 添加卫星轨道
        const orbitStats = addSatelliteOrbits(viewer, orbitData);
        
        // 添加图例
        addLegend(viewer, eventStats, orbitStats);
        
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
                    if (entity.id.startsWith('event_')) {
                        // 处理掩星事件点击
                        const eventIndex = entity.id.split('_')[1];
                        const startEntity = viewer.entities.getById(`event_${eventIndex}_start`);
                        const endEntity = viewer.entities.getById(`event_${eventIndex}_end`);
                        
                        if (startEntity && startEntity.label) {
                            startEntity.label.show = true;
                        }
                        if (endEntity && endEntity.label) {
                            endEntity.label.show = true;
                        }
                        
                        //console.log(`选中掩星事件 ${parseInt(eventIndex) + 1}`);
                    } else if (entity.id.startsWith('orbit_')) {
                        // 处理卫星轨道点击
                        const satName = entity.id.split('_')[1];
                        const currentEntity = viewer.entities.getById(`orbit_${satName}_current`);
                        
                        if (currentEntity && currentEntity.label) {
                            currentEntity.label.show = true;
                        }
                        
                        //console.log(`选中卫星 ${satName}`);
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
        
        //console.log(`Cesium渲染完成!显示${eventStats.total}条轨迹, ${orbitStats.nav + orbitStats.leo}个卫星轨道。支持鼠标拖拽、滚轮缩放、双击定位。`);
        showStatus(`Cesium渲染完成!显示${eventStats.total}条轨迹, ${orbitStats.nav + orbitStats.leo}个卫星轨道。支持鼠标拖拽、滚轮缩放、双击定位。`);
        
        // 启动文件更新监测
        startFileMonitoring(viewer);
        
    } catch (error) {
        console.error('Cesium数据加载失败:', error);
        showStatus(`数据加载失败: ${error.message}`);
        throw error;
    }
}

// 清理函数
function cleanup() {
    if (fileCheckInterval) {
        clearInterval(fileCheckInterval);
        fileCheckInterval = null;
        console.log('文件更新监测已停止');
    }
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', cleanup); 
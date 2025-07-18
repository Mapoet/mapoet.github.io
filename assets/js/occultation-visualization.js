const eventFile = '/assets/data/occultation_events.json';
const statusDiv = document.getElementById('status');

function getColor(type) {
    if (type === 'iono') return '#00ffff';
    if (type === 'atm') return '#ff8800';
    return '#cccccc';
}

function showStatus(message) {
    statusDiv.innerHTML = message;
    console.log(message);
}

// 检查 ECharts 是否正确加载
if (typeof echarts === 'undefined') {
    showStatus('错误：ECharts 库未正确加载');
} else {
    showStatus('ECharts 库已加载，正在获取数据...');
}

d3.json(eventFile)
    .then(function(data) {
        showStatus(`数据加载成功，共 ${data.length} 个事件`);
        console.log('数据预览:', data.slice(0, 2));
        
        // 只取前10个事件进行测试
        const testData = data.slice(0, 10);
        showStatus(`测试模式：只显示前 ${testData.length} 个事件`);
        
        const series = [];
        let validEvents = 0;
        
        testData.forEach((event, index) => {
            if (!event.points || event.points.length < 2) {
                console.log(`事件 ${index} 点数不足:`, event.points?.length);
                return;
            }
            
            const coords = event.points.map(p => {
                const lon = parseFloat(p.lon) || 0;
                const lat = parseFloat(p.lat) || 0;
                const alt = parseFloat(p.alt) || 0;
                return [lon, lat, alt * 100]; // ECharts GL高度单位为km*100
            });
            
            console.log(`事件 ${index} (${event.type}): ${coords.length} 个点`);
            console.log(`坐标范围: lon[${Math.min(...coords.map(c=>c[0]))}, ${Math.max(...coords.map(c=>c[0]))}], lat[${Math.min(...coords.map(c=>c[1]))}, ${Math.max(...coords.map(c=>c[1]))}], alt[${Math.min(...coords.map(c=>c[2]))}, ${Math.max(...coords.map(c=>c[2]))}]`);
            
            series.push({
                type: 'lines3D',
                coordinateSystem: 'globe',
                effect: {
                    show: true,
                    trailWidth: 2,
                    trailLength: 0.2,
                    trailOpacity: 0.7,
                    trailColor: getColor(event.type)
                },
                lineStyle: {
                    width: 2,
                    color: getColor(event.type),
                    opacity: 0.8
                },
                data: coords
            });
            validEvents++;
        });
        
        showStatus(`有效事件: ${validEvents}/${testData.length}，正在渲染...`);
        console.log('Series配置:', series);
        
        const chart = echarts.init(document.getElementById('main'));
        const option = {
            backgroundColor: '#000',
            globe: {
                baseTexture: 'https://echarts.apache.org/examples/data-gl/asset/world.topo.bathy.200401.jpg',
                heightTexture: 'https://echarts.apache.org/examples/data-gl/asset/bathymetry_bw_composite_4k.jpg',
                shading: 'lambert',
                environment: '#222',
                globeOuterRadius: 100,
                viewControl: {
                    autoRotate: true,
                    autoRotateAfterStill: 5,
                    distance: 200
                },
                light: {
                    main: { intensity: 1.2 },
                    ambient: { intensity: 0.5 }
                }
            },
            series: series
        };
        
        console.log('ECharts配置:', option);
        chart.setOption(option);
        showStatus(`渲染完成！共显示 ${validEvents} 条轨迹`);
    })
    .catch(function(error) {
        showStatus(`数据加载失败: ${error.message}`);
        console.error('数据加载错误:', error);
    }); 
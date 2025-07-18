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

// 详细检查所有依赖库
function checkDependencies() {
    showStatus('检查依赖库...');
    
    if (typeof echarts === 'undefined') {
        showStatus('错误：ECharts 库未正确加载');
        return false;
    }
    
    console.log('ECharts版本:', echarts.version);
    console.log('ECharts对象:', echarts);
    
    if (typeof echarts.gl === 'undefined') {
        showStatus('错误：ECharts GL 扩展未正确加载');
        console.log('echarts.gl:', echarts.gl);
        return false;
    }
    
    console.log('ECharts GL已加载:', echarts.gl);
    
    if (typeof d3 === 'undefined') {
        showStatus('错误：D3.js 库未正确加载');
        return false;
    }
    
    showStatus('所有依赖库已加载，正在获取数据...');
    return true;
}

// 检查DOM元素
function checkDOM() {
    const mainDiv = document.getElementById('main');
    if (!mainDiv) {
        showStatus('错误：找不到 #main 元素');
        return false;
    }
    
    const statusDiv = document.getElementById('status');
    if (!statusDiv) {
        showStatus('错误：找不到 #status 元素');
        return false;
    }
    
    return true;
}

// 主函数
function initVisualization() {
    console.log('开始初始化可视化...');
    
    if (!checkDOM()) {
        return;
    }
    
    if (!checkDependencies()) {
        return;
    }
    
    // 先尝试创建一个简单的测试图表
    try {
        const testChart = echarts.init(document.getElementById('main'));
        const testOption = {
            backgroundColor: '#000',
            globe: {
                // 使用简化的地球配置，避免CORS问题
                baseTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                heightTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                shading: 'color',
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
            series: []
        };
        
        testChart.setOption(testOption);
        showStatus('基础地球渲染成功，正在加载数据...');
        console.log('基础地球渲染成功');
        
        // 加载数据
        loadData(testChart);
        
    } catch (error) {
        showStatus(`ECharts初始化失败: ${error.message}`);
        console.error('ECharts初始化错误:', error);
    }
}

function loadData(chart) {
    d3.json(eventFile)
        .then(function(data) {
            showStatus(`数据加载成功，共 ${data.length} 个事件`);
            console.log('数据预览:', data.slice(0, 2));
            
            // 只取前5个事件进行测试
            const testData = data.slice(0, 5);
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
            
            showStatus(`有效事件: ${validEvents}/${testData.length}，正在渲染轨迹...`);
            console.log('Series配置:', series);
            
            // 更新图表
            const option = {
                backgroundColor: '#000',
                globe: {
                    // 使用简化的地球配置，避免CORS问题
                    baseTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                    heightTexture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1透明图片
                    shading: 'color',
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
            chart.setOption(option, true); // 第二个参数为true表示完全替换
            showStatus(`渲染完成！共显示 ${validEvents} 条轨迹`);
        })
        .catch(function(error) {
            showStatus(`数据加载失败: ${error.message}`);
            console.error('数据加载错误:', error);
        });
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualization);
} else {
    initVisualization();
} 
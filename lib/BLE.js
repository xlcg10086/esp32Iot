class BLE{
	constructor(isIOS = false) {
	    this.isIOS = isIOS || false //是否为ios
	    this.available = false //蓝牙适配器状态
	    this.searching = false //蓝牙搜索状态
	    this.connected = false //蓝牙连接状态
		this.devicelist=[]
		this.deviceId = '' //需要连接的蓝牙设备id
		this.deviceName = ''
		this.onDeviceFound = null
	    this.searchTimeout = 10000 // 默认搜索时长10s
	    this.timeout = 0 //搜索超时时长
	    this.serviceId = 'DCE81000-C4E7-430D-AD4F-1A1F238D0BD4' //服务id
	    this.sendCharacteristicId = '0000FE61-0000-1000-8000-00805F9B34FB' //发送特征码
	    this.reCharacteristicId = '0000FE62-0000-1000-8000-00805F9B34FB' //读取特征码
	    this.readCommand = '6821AAAAAAAAAAAAAA0813010004EE950BDFE352DCEE8588CBEDB8D145344F16' //要发送的指令
		
	}
	
	//开启蓝牙适配器
	openBluetoothAdapter() {
	    const self = this
	    return new Promise((resolve, reject) => {
	        uni.openBluetoothAdapter({
	            success(res) {
	                console.log('初始化蓝牙成功', res)
	                uni.showToast({
	                    duration: 1000,
	                    title: '蓝牙已开启',
	                    icon: 'success'
	                })
	                self.available = true
	                //监听连接状态
	                uni.onBLEConnectionStateChange((res1) => {
	                    console.log(`设备${res1.deviceId} 连接状态已更改, 连接状态: ${res1.connected}`)
	                    self.connected = res1.connected
	                    if (!res1.connected) {
	                        uni.showToast({
	                            duration: 2000,
	                            title: '当前设备已断开连接',
	                            icon: 'error'
	                        })
	                    }
	                })
	                resolve(res)
	            },
	            fail(err) {
	                console.log('初始化蓝牙失败', err)
	                if (err.errCode === 10001) {
	                    self.available = false
	                    reject('请确保开启手机蓝牙')
	                }
	                reject('蓝牙设备异常')
	            },
	            complete() {
	                // 监听蓝牙适配器状态变化事件
	                uni.onBluetoothAdapterStateChange((res) => {
	                    if (res.available) {
	                        self.available = true
	                    } else {
	                        uni.showToast({
	                            duration: 1000,
	                            title: '蓝牙已关闭',
	                            icon: 'error'
	                        })
	                        self.available = false
	                        self.connected = false
	                    }
	                })
	            }
	        })
	    })
	}
	
	//关闭蓝牙适配器
	closeBluetoothAdapter() {
	    console.log('关闭蓝牙适配器')
	    const self = this
	    return new Promise((resolve, reject) => {
	        uni.closeBluetoothAdapter({
	            success: (res) => {
	                self.available = false //蓝牙适配器状态
	                self.searching = false //蓝牙搜索状态
	                self.connected = false //蓝牙连接状态
	                // self.deviceId = '' //需要连接的蓝牙设备id
	                resolve('蓝牙适配器已关闭')
	            },
	            fail: (err) => reject('蓝牙关闭异常')
	        })
	    })
	}
	
	
	// 搜索周围的设备
	async searchDevices(timeout) {
		if(timeout<3000) //最少搜索3s
			timeout = 3000		
		const self = this;
		return new Promise((resolve, reject) =>{
			//开始搜索蓝牙设备
			uni.startBluetoothDevicesDiscovery({
				success: (res) => {
					uni.showToast({
						// duration: 2000,
					    title: '蓝牙搜索中',
					    icon: 'loading',
						mask: true
					})
					self.searching = true;
				},
				fail:(err)=> {
				    console.error('搜索失败', err)
				    // uni.hideLoading()
				    reject ('请检查蓝牙及位置状态')
				},
			});
			
			// 设置超时，若超时则停止搜索
			if (timeout > 0) {
				setTimeout(async () => {
					self.stopSearchDevices();
					if(!self.devicelist.length){
						uni.showToast({
						    title: '蓝牙搜索超时，请重新尝试',
						    icon: "none"
						})
						reject ('蓝牙搜索超时')
					}
					else {
						resolve(self.devicelist)
					}
				}, timeout);
			}			
			// 监听搜索到新设备的事件
			uni.onBluetoothDeviceFound((res) => {
				console.log('发现新设备', res.devices[0]);
				// 将新设备添加到设备列表
				self.devicelist.push(res.devices[0]);
				if (self.onDeviceFound) {
					self.onDeviceFound(res.devices[0]);
				}
			});
			
			//处理提前发生的蓝牙设备连接，关闭搜索
			uni.onBLEConnectionStateChange((res)=>{
				console.log("已经连接ble设备");
				self.stopSearchDevices();
			});
			
		});
	}
		
	
	
	
	// 停止搜索设备
	stopSearchDevices() {
		const self = this;
		if(self.searching){
			return new Promise((resolve, reject) => {
				uni.stopBluetoothDevicesDiscovery({
					success: (res) => {
						console.log('停止搜索设备', res);
						self.searching = false;
						resolve('设备搜索已停止');
					},
					fail: (err) => {
						console.error('停止搜索设备失败', err);
						reject('停止搜索设备失败');
					},
				});
			});
		}
		else{
			console.log('已经停止搜索了');
		}
	}
	

		
	//连接低功耗蓝牙
	createBLEConnection(deviceId) {
	    const self = this
	    uni.showLoading({
	        title: '连接中请稍后',
			mask: true
	    })
	    return new Promise((resolve, reject) => {
	        uni.createBLEConnection({
	            deviceId: deviceId,
	            success(res) {
	                console.log('连接成功: ', res)
	                // 根据主服务 UUID 获取已连接的蓝牙设备。
	                uni.getConnectedBluetoothDevices({
	                    services: [self.serviceId],
	                    success(res) {
	                        console.log('根据主服务UUID 获取已连接的蓝牙设备。', res)
	                    }
	                })
	                self.deviceId = deviceId
	                if (!self.isIOS) {
	                    uni.setBLEMTU({
	                        deviceId: deviceId || self.deviceId,
	                        mtu: 210
	                    })
	                }
	                uni.hideLoading()
	                uni.showToast({
	                    icon: 'success',
	                    title: '蓝牙已连接',
	                    duration: 2000
	                })
	                self.connected = true
	                resolve(res)
	            },
	            fail(err) {
	                console.error('连接失败', err)
	                self.connected = false
	                uni.showToast({
	                    title: '蓝牙连接失败',
	                    icon: 'error'
	                })
	                reject('蓝牙连接异常,请保持设备在3米范围内')
	            },
	            complete() {
	                uni.hideLoading()
	            }
	        })
	    })
	}
	
	//断开低功耗蓝牙连接
	closeBLEConnection(deviceId) {
	    const self = this
	    return new Promise((resolve, reject) => {
	        uni.closeBLEConnection({
	            deviceId: deviceId || self.deviceId,
	            success: (res) => {
	                console.log('蓝牙已断开')
	                self.connected = false
	                resolve('蓝牙已断开')
	            },
	            fail: (e) => {
	                console.log('蓝牙未能正常断开')
	                reject('蓝牙未能正常断开')
	            }
	        })
	    })
	}	
		
	//获取指定蓝牙设备服务
	getBLEDeviceServices(deviceId) {
	    return new Promise((resolve, reject) => {
	        uni.getBLEDeviceServices({
	            deviceId,
	            success(res) {
	                console.log('获取服务成功: ', res)
	                resolve(res)
	            },
	            fail(err) {
	                console.error('获取服务失败', err)
	                reject('获取服务失败')
	            }
	        })
	    })
	}
	
	//获取服务特征值
	getBLEDeviceCharacteristics(deviceId) {
	    const self = this
	    return new Promise((resolve, reject) => {
	        uni.getBLEDeviceCharacteristics({
	            deviceId,
	            serviceId: self.serviceId,
	            success(res) {
	                console.log('获取特征值成功: ', res)
	                resolve(res)
	            },
	            fail(err) {
	                console.error(err)
	                reject('获取特征值失败')
	            }
	        })
	    })
	}
	
	//获取信号强度
	getBLERSSI() {
	    const self = this
	    return new Promise((resolve, reject) => {
	        uni.getBLEDeviceRSSI({
	            deviceId:self.deviceId,
	            success(res) {
	                console.log('获取信号强度成功: ', res)
	                resolve(res)
	            },
	            fail(err) {
	                console.error(err)
	                reject('获取信号强度失败')
	            }
	        })
	    })
	}
	
	//启用蓝牙低功耗设备特征值变化时的 notify 功能，订阅特征
	notify(deviceId, serviceId, state = true) {
	    const self = this
	    return new Promise((resolve, reject) => {
	        uni.notifyBLECharacteristicValueChange({
	            deviceId,
	            serviceId,
	            characteristicId: self.reCharacteristicId,
	            state,
	            type: 'notification',
	            success(res) {
	                console.log('订阅成功', res)
	                resolve(res)
	            },
	            fail(err) {
	                console.error(err)
	                reject('订阅失败')
	            }
	        })
	    })
	}
	
	//监听蓝牙低功耗设备的特征值变化事件
	onBLECharacteristicValueChange() {
	    const self = this
	    console.log('开始监听特征值变化')
	    return new Promise((resolve) => {
	        uni.onBLECharacteristicValueChange((res) => {
	            let resHex = self.ab2hex(res.value)
	            console.log('接收到数据  ', resHex)
	            resolve(resHex)
	        })
	    })
	}
	
	//发送数据
	send(command, deviceId) {
	    const self = this
	    // let msg = command // 向蓝牙设备发送一个0x00的16进制数据
	    let typedArray = new Uint8Array(
	        command.match(/[\da-f]{2}/gi).map(function (h) {
	            return parseInt(h, 16)
	        })
	    )
	    let buffer = typedArray.buffer
	    // let hexBytes = new Uint8Array(msg.length / 2)
	    // for (let i = 0; i < msg.length; i += 2) {
	    //     hexBytes[i / 2] = parseInt(msg.substring(i, i + 2), 16)
	    // }
	    // let buffer = hexBytes.buffer
	    // let dataView = new DataView(buffer)
	    return new Promise((resolve, reject) => {
	        uni.writeBLECharacteristicValue({
	            deviceId,
	            serviceId: self.serviceId,
	            characteristicId: self.sendCharacteristicId,
	            value: buffer,
	            success(res) {
	                console.log('发送成功', res.errMsg)
	                resolve()
	            },
	            fail(err) {
	                console.error(err)
	                uni.showToast({
	                    title: '发送指令失败',
	                    icon: 'error'
	                })
	                reject()
	            }
	        })
	    })
	}
	
	//读取特征值变化
	readBLECharacteristicValue(deviceId, serviceId, characteristicId) {
	    return new Promise((resolve, reject) => {
	        uni.readBLECharacteristicValue({
	            deviceId,
	            serviceId,
	            characteristicId,
	            success: (res) => resolve(res),
	            fail: (err) => reject('读取特征值变化异常')
	        })
	    })
	}
	
	// ArrayBuffer转16进制字符串
	ab2hex(buffer) {
	    const hexArr = Array.prototype.map.call(new Uint8Array(buffer), function (bit) {
	        return ('00' + bit.toString(16)).slice(-2)
	    })
	    return hexArr.join('')
	}
	
	//ios下从广播数据中获取设备的mac地址,此处根据业务实际需求来
	convertMac(device) {
	    if (device.deviceId) {
	        // const buffer = device.advertisData.slice(2, 8)
	        // let deviceMac = Array.prototype.map
	        //     .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
	        //     .reverse()
	        //     .join(':')
	        // deviceMac = deviceMac.toUpperCase()
			// deviceMac = device.deviceId
	        return device.deviceId
	    }
	}
	
}

export default BLE
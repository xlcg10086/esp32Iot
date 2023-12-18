<template>
	<view class="startpage">
		<image class="logo" src="/static/R.jpg"></image>
		<view class="text-area">
			<view class="title" >{{title}}</view>
			<view class="content">{{content}}</view>
		</view>
		<view class="buttonbox">
			<view class="bleopen">
				<button type="primary" @click="openBluetooth">打开蓝牙</button>
			</view>
			<view class="bleconbtn">
				<button type="primary" @click="getBluetoothList">搜索设备</button>
			</view>
		</view>
		<view class="devicelist">
			<view v-for="(item,index) in deviceList" :key="item.id" @click="connectBluetooth(index)"
				:class="connectDeviceIndex === index ? 'devicelist_list_clicked' : 'devicelist_list'">
				<view class="devicename">
					<view class="box1" >
						设备名称：
					</view>
					<view class="box2">
						{{item.devicename}}
					</view>
				</view>
				<view class="deviceid">
					<view class="box1" >
						设备ID：
					</view>
					<view class="box2">
						{{item.deviceid}}
					</view>
				</view>		
			</view>
			<view class="statics">
				{{`共计${deviceList.length}个设备`}}
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: '蓝牙连接',
				content: '请打开蓝牙，连接蓝牙设备',
				deviceList:[],
				connectDeviceIndex: null,
				connectDeviceId: null,
			}
		},
		computed:{
			bluetooth(){
				return this.$store.getters.getBluetoothInstance
			}
		},
		onLoad() {
			uni.authorize({
			    scope: 'scope.userLocation',
			})
		},
		methods: {
			openBluetooth(){
				uni.getLocation({
					success:(res)=>{
						if(!this.bluetooth.available){
							this.bluetooth.openBluetoothAdapter().catch((e) => {
							    uni.showToast({
							        title:'蓝牙开启失败',
							        icon: 'error'
							    })
							})
						}
					},
					fail:(err)=>{
						if(err.errCode == 2){
							uni.showToast({
								title:'请打开位置授权',
								icon:'error'
							})
						}
					},	
				})				
			},
			
			getBluetoothList(){
				if (this.bluetooth.available) {
					//注册回调函数
					this.bluetooth.onDeviceFound = (newDevice) => {
					  this.deviceList.push({
						deviceid: newDevice.deviceId,
						devicename: newDevice.localName
					  });
					};
					this.bluetooth.searchDevices(10000)//搜索10s
						.then((deviceList) => {
						// 设备搜索完成
							console.log('设备搜索完成', deviceList);
						})
						.catch((error) => {
							console.error('设备搜索失败', error);
						});
					}
				else{
					uni.showToast({
					    title:'蓝牙尚未开启',
					    icon: 'error',
						})
					}
			},
			
			connectBluetooth(index)	{
				this.connectDeviceIndex = index
				console.log(this.deviceList[index].deviceid)
				this.connectDeviceId = `${this.deviceList[index].deviceid}`
				if(!this.bluetooth.connected){
					this.bluetooth.createBLEConnection(this.connectDeviceId)
					.then((res)=>{
						console.log('createBLEConnection success')
						console.log(res)
						this.$store.commit('setBluetoothName',this.deviceList[index].devicename)
						uni.reLaunch({
							url:'/pages/bluetooth/bluetooth',
							success(res){
								console.log('navigate ok')
							},
							fail(err){
								console.log(err)
							},
						})
					})
					.catch((error)=>{
						console.log(error)
					})
				}
			}
				
				
				
				
			

		}	//methods结尾
		
	}
</script>

<style lang="scss">
	.startpage {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.logo {
		height: 400rpx;
		width: 750rpx;
		/* margin-top: 2rpx; */
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 20rpx;
	}

	.text-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		.title {
			font-size: 50rpx;
			color: #0d47a1;
		}
		.content{
			font-size: 28rpx;
			color: #8f8f94;
		}
	}
	.buttonbox{
		display: flex;
		align-items: center;
		justify-content: space-between;
		.bleconbtn,.bleopen{
			margin-top: 50rpx;
			width: 240rpx;
			margin-left: 25rpx;
			margin-right: 25rpx;	// width: 300rpx;
		}
	}
	
	.devicelist {
		margin-top: 50rpx;
	    border: 1px solid #ccc; // Border color and width
	    border-radius: 10rpx; // Border radius for rounded corners
	    box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1); // Shadow for a subtle effect
	    padding: 10rpx; // Add padding as needed
		width: 700rpx;
		.devicelist_list {
			border-bottom: 1rpx solid #ccc; // Border between items
			margin-bottom: 10rpx; // Add margin between items
			padding-bottom: 10rpx; // Add padding between items
		}
		.devicelist_list_clicked{
			border-bottom: 2rpx solid #ccc; // Border between items
			box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1); // Shadow for a subtle effect
			background-color: #bbb;
			margin-bottom: 10rpx; // Add margin between items
			padding-bottom: 10rpx; // Add padding between items	
		}
		.statics{
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 20rpx;
			color: #bbb;
		}
	}
	
	.devicename, .deviceid {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 5px; // Add margin between devicename and deviceid
		.box1, .box2 {
		  flex: 1;
		}
	}
	
	
</style>

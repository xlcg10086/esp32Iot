<template>
	<view>
		<view class="text-area">
			<view class="title">
				{{deviceName}}
			</view>
			<view class="content">
				MAC：{{deviceId}}
			</view>
			<view class="content">
				信号强度：{{RSSI}}
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				timer: null,
				deviceId:'',
				deviceName:'',
				RSSI:null,
				service:[],
				characteristic:[],
			};
		},
		onLoad(){
			console.log("进入新的蓝牙页面")
			// console.log(this.bluetooth.deviceId)
			this.deviceName = this.bluetooth.deviceName
			this.deviceId = this.bluetooth.deviceId
			this.timer = setInterval(() => {
			    this.bluetooth.getBLERSSI()
				.then((res) => {
					// console.log(res);
					this.RSSI = res.RSSI;
				})
				.catch((err) => {
					console.log(err);
				});
			}, 1000);
			
			getBLEDeviceServices(this.bluetooth.deviceId)
			.then(res=>{
				this.service = res
				console.log(res)
			})
			.catch(err=>{
				console.log(err)
			})
			
			getBLEDeviceCharacteristics(this.bluetooth.deviceId)
			.then(res=>{
				this.characteristic = res
				console.log(res)
			})
			.catch(err=>{
				console.log(err)
			})
			
			
		},
		onUnload(){
			if(this.timer){
				clearInterval(this.timer)
				this.timer = null
			}
			
		},
		computed:{
			bluetooth(){
				return this.$store.getters.getBluetoothInstance
			}
		},
		methods: {
			
			
		}//method结尾
		
	}
</script>

<style lang="scss">
	
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
</style>

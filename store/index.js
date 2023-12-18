// 页面路径：store/index.js
import { createStore } from 'vuex'
import BLE from "@/lib/BLE.js"
const store = createStore({
	state(){
		return{
			Bluetooth:new BLE(),
			
		}
	},
	getters:{
		getBluetoothInstance: state => state.Bluetooth,
	},
	mutations:{
		setBluetoothName(state,name){
			state.Bluetooth.deviceName = name;
		}
	},
	actions:{
		
	},
	modules:{
		
	}

})

export default store

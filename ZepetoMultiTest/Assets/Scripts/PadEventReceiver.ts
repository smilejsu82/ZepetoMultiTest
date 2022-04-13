import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Vector3, Transform, GameObject } from 'UnityEngine'
import { ZepetoScreenTouchpad } from 'ZEPETO.Character.Controller';

export default class PadEventReceiver extends ZepetoScriptBehaviour 
{
    public pad : ZepetoScreenTouchpad;

    Start(){
        this.pad.OnPointerDownEvent.AddListener(()=>{
            console.log('[OnPointerDownEvent] down');
        });
        this.pad.OnDragEvent.AddListener((v2)=>{
            console.log(`[OnDragEvent] v2: ${v2}`);
        });
        this.pad.OnPointerUpEvent.AddListener(()=>{
            console.log('[OnPointerUpEvent] up');
        });
    }
}
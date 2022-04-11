import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Room, RoomData} from 'ZEPETO.Multiplay'
import { CharacterController, GameObject, Physics, Vector3, LayerMask } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Action$2 } from 'System'

export default class PlayerController extends ZepetoScriptBehaviour {

    private room : Room;
    private sessionId: string;

    private targetSessionId : string;
    private targetGo : GameObject;

    private center : Vector3;

    public findTargetAction :  Action$2<string, string>;


    public Init(sessionId: string, room : Room){
        
        this.sessionId = sessionId;
        this.room = room;

        this.center = this.GetComponent<CharacterController>().bounds.center;

        this.gameObject.layer = LayerMask.NameToLayer("Player");
    }

    public IsLocal(){
        return this.room != null;
    }

    public GetSetssionId()
    {
        return this.sessionId;
    }

    public SetTarget(targetSessionId : string){
        this.targetSessionId = targetSessionId;
        var targetZepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.targetSessionId);
        this.targetGo = targetZepetoPlayer.character.gameObject;
    }

    Update(){
        
        var colliders = Physics.OverlapSphere(this.center, 3.0, 1 << 21);
        
        for(var i = 0; i<colliders.length; i++){
            if( colliders[i]!= null && colliders[i].gameObject != this.gameObject){

                this.findTargetAction(this.sessionId, colliders[i].gameObject.GetComponent<PlayerController>().GetSetssionId());

                break;
            }
        }
    }

    LateUpdate(){
        // if(this.targetGo){
        //     this.transform.LookAt(this.targetGo.transform);
        // }
    }

}
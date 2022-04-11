import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Room, RoomData} from 'ZEPETO.Multiplay'
import { GameObject } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';

export default class PlayerController extends ZepetoScriptBehaviour {

    private room : Room;
    private sessionId: string;

    private targetSessionId : string;
    private targetGo : GameObject;

    public Init(sessionId: string, room : Room){
        this.sessionId = sessionId;
        this.room = room;
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

    LateUpdate(){
        if(this.targetGo){
            this.transform.LookAt(this.targetGo.transform);
        }
    }

}
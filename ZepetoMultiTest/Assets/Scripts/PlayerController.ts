import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Room, RoomData } from 'ZEPETO.Multiplay'
import { CharacterController, GameObject, Physics, Vector3, Object, LayerMask, Resources } from 'UnityEngine';
import { CharacterState, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Action$2 } from 'System'

export default class PlayerController extends ZepetoScriptBehaviour {

    private room: Room;
    private sessionId: string;

    private targetSessionId: string;
    private targetGo: GameObject;

    private center: Vector3;

    public hash: string;

    public findTargetAction: Action$2<string, string>;
    private zepetoPlayer : ZepetoPlayer;

    private drawGizmoGo : GameObject;

    Awake(){
        var prefab = Resources.Load("DrawGizmo") as GameObject;
        this.drawGizmoGo = Object.Instantiate(prefab, this.transform) as GameObject;
    }

    public Init(sessionId: string, hash: string, room: Room, zepetoPlayer : ZepetoPlayer) {

        

        this.sessionId = sessionId;
        this.room = room;
        this.hash = hash;
        this.zepetoPlayer = zepetoPlayer;

        this.center = this.GetComponent<CharacterController>().bounds.center;
        //this.zepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.sessionId);
        

        this.gameObject.layer = LayerMask.NameToLayer("Player");
    }

    public IsLocal() {
        return this.room != null;
    }

    public GetSetssionId() {
        return this.sessionId;
    }

    // public SetTarget(targetSessionId : string){
    //     this.targetSessionId = targetSessionId;
    //     var targetZepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.targetSessionId);
    //     this.targetGo = targetZepetoPlayer.character.gameObject;
    // }

    public SetTarget(targetGo: GameObject) {
        this.targetGo = targetGo;
    }

    Update() {
        
        if(this.zepetoPlayer.character.CurrentState == CharacterState.Run){
            if(this.room != null && this.sessionId == this.room.SessionId){

                console.log('find target');

                var colliders = Physics.OverlapSphere(this.center, 3.0, 1 << 21);

                for (var i = 0; i < colliders.length; i++) {
                    if (colliders[i] != null && colliders[i].gameObject != this.gameObject) {
        
                        this.findTargetAction(this.hash, colliders[i].gameObject.GetComponent<PlayerController>().hash);
        
                        break;
                    }
                }
            }
        }
    }

    LateUpdate() {

        if(this.zepetoPlayer.character.CurrentState == CharacterState.Run){
            if (this.targetGo) {
                this.transform.LookAt(this.targetGo.transform);
            }
        }
        
    }

}
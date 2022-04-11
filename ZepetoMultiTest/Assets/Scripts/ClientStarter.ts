import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World'
import {Room, RoomData} from 'ZEPETO.Multiplay'
import {Player, State, Vector3} from 'ZEPETO.Multiplay.Schema'
import {CharacterState, SpawnInfo, ZepetoPlayers, ZepetoPlayer} from 'ZEPETO.Character.Controller'
import * as UnityEngine from "UnityEngine";
import PlayerController from './PlayerController'
import res_OnLookAtTarget from './res_OnLookAtTarget'

export default class Starter extends ZepetoScriptBehaviour {

    public multiplay: ZepetoWorldMultiplay;

    private room: Room;
    private currentPlayers: Map<string, Player> = new Map<string, Player>();

    private Start() {

        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
            
            this.room.AddMessageHandler('onLookAtTarget', (message)=>{

                var res = message as res_OnLookAtTarget;

                var fromId : string = res.fromId;
                var toId : string = res.toId;

                console.log(fromId, toId);

            });


        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        };

        this.StartCoroutine(this.SendMessageLoop(0.1));
    }

    // 일정 Interval Time으로 내(local)캐릭터 transform을 server로 전송합니다.
    private* SendMessageLoop(tick: number) {
        while (true) {
            yield new UnityEngine.WaitForSeconds(tick);

            if (this.room != null && this.room.IsConnected) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if (hasPlayer) {
                    const myPlayer = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                    if (myPlayer.character.CurrentState != CharacterState.Idle)
                    {
                        this.SendTransform(myPlayer.character.transform);

                        //this.SendLookAt(fromId, toId);
                    }
                        
                }
            }
        }
    }

    private localZepetoPlayer : ZepetoPlayer;

    private OnStateChange(state: State, isFirst: boolean) {

        // 첫 OnStateChange 이벤트 수신 시, State 전체 스냅샷을 수신합니다.
        if (isFirst) {

            // [CharacterController] (Local)Player 인스턴스가 Scene에 완전히 로드되었을 때 호출
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                this.localZepetoPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;

                var playerController = this.localZepetoPlayer.character.gameObject.AddComponent<PlayerController>();
                playerController.Init(this.room.SessionId, this.room);

                playerController.findTargetAction = (fromId, toId)=>{

                    ZepetoPlayers.instance.GetPlayer(fromId).character.gameObject.GetComponent<PlayerController>().SetTarget(toId);

                };

                this.localZepetoPlayer.character.OnChangedState.AddListener((cur, prev) => {
                    this.SendState(cur);
                });
            });

            // [CharacterController] Player 인스턴스가 Scene에 완전히 로드되었을 때 호출
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                const isLocal = this.room.SessionId === sessionId;
                if (!isLocal) {
                    const player: Player = this.currentPlayers.get(sessionId);
                    
                    var zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
                    var playerController = zepetoPlayer.character.gameObject.AddComponent<PlayerController>();
                    playerController.Init(sessionId, null);

                    playerController.findTargetAction = (fromId, toId)=>{


                        ZepetoPlayers.instance.GetPlayer(fromId).character.gameObject.GetComponent<PlayerController>().SetTarget(toId);

                        // ZepetoPlayers.instance.GetPlayer(fromId).character.transform.LookAt(
                        //     ZepetoPlayers.instance.GetPlayer(toId).character.transform
                        // );
                    };

                    // [RoomState] player 인스턴스의 state가 갱신될 때마다 호출됩니다.
                    player.OnChange += (changeValues) => this.OnUpdatePlayer(sessionId, player);
                }
            });
        }

        let join = new Map<string, Player>();
        let leave = new Map<string, Player>(this.currentPlayers);

        state.players.ForEach((sessionId: string, player: Player) => {
            if (!this.currentPlayers.has(sessionId)) {
                join.set(sessionId, player);
            }
            leave.delete(sessionId);
        });

        // [RoomState] Room에 입장한 player 인스턴스 생성
        join.forEach((player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player));

        // [RoomState] Room에서 퇴장한 player 인스턴스 제거
        leave.forEach((player: Player, sessionId: string) => this.OnLeavePlayer(sessionId, player));
    }

    private * WaitForLoadLocalPlayer(callback){
        while(true){
            if(this.localZepetoPlayer){
                break;
            }
            yield null;
        }
        callback();
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        console.log(`[OnJoinPlayer] players - sessionId : ${sessionId}`);
        this.currentPlayers.set(sessionId, player);

        const spawnInfo = new SpawnInfo();
        const position = this.ParseVector3(player.transform.position);
        const rotation = this.ParseVector3(player.transform.rotation);
        spawnInfo.position = position;
        spawnInfo.rotation = UnityEngine.Quaternion.Euler(rotation);

        const isLocal = this.room.SessionId === player.sessionId;
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private OnLeavePlayer(sessionId: string, player: Player) {
        console.log(`[OnRemove] players - sessionId : ${sessionId}`);
        this.currentPlayers.delete(sessionId);

        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private OnUpdatePlayer(sessionId: string, player: Player) {

        console.log('OnUpdatePlayer');

        const position = this.ParseVector3(player.transform.position);

        const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
        zepetoPlayer.character.MoveToPosition(position);

        if (player.state === CharacterState.JumpIdle || player.state === CharacterState.JumpMove)
            zepetoPlayer.character.Jump();
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const data = new RoomData();

        const pos = new RoomData();
        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);
        data.Add("position", pos.GetObject());

        const rot = new RoomData();
        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);
        data.Add("rotation", rot.GetObject());
        this.room.Send("onChangedTransform", data.GetObject());
    }

    private SendLookAt(fromId:string, toId:string){
        const data = new RoomData();
        data.Add("fromId", fromId);
        data.Add("toId", toId);
        this.room.Send("onLookAtTarget", data.GetObject());
    }

    private SendState(state: CharacterState) {
        const data = new RoomData();
        data.Add("state", state);
        this.room.Send("onChangedState", data.GetObject());
    }

    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
        (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }
}
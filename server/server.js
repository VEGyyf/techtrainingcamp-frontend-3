var userCnt=0;//方操写的没敢动
var ROOM_SIZE=4;//房间大小
var ROOM_NUM=6;//房间数量
var roomArray=new Array(ROOM_NUM);//存储每个房间中人的uid

for(let i=0;i<ROOM_NUM;i++)
{
    roomArray[i]=new Array(ROOM_SIZE);
}

var user_socket=[]
for(var n=0; n<500; n++){
    user_socket[n] = 0;    
}

var room_num = [];
for(var n=0; n<ROOM_NUM; n++){
    room_num[n] = 0;    
}

var user_roomid=[]
for(var n=0; n<500; n++){
    user_roomid[n] = -1;    
}
var all_data={
    "user_socket":user_socket, //uid->socket
    "user_name":new Array(500), //uid->username
    "user_state":new Array(500), //disconn表示已经断开
    "user_roomid":user_roomid, //用户在哪个房间 初始化-1
    "room_info":roomArray,
    "room_num":room_num
}

var return_data={
    "state":"null", //RINI,RLOG,RJOI,RRUN,READY
    "userid":0, //用户的id
    "username":"null",
    "roomid":0, //用户所在的房间号
    "roomnum":0, //房间中人数
    "user_roomid":0, //用户在房间中的编号
    "board":null, //发送board数组，申请开始游戏时发送null
    "score":0, //用户分数
    "error":false,
    "names":new Array(4) //同房间用户名
}

const { COPYFILE_FICLONE_FORCE } = require("constants");
var ws = require("nodejs-websocket");
console.log("开始建立连接...")

var server = ws.createServer(function(conn){
    conn.on("text", function (str) {

        let received_message=JSON.parse(str);
        console.log(received_message); //输出到控制台

        if(received_message["state"]=="INI"){ //连接初始化，分配id
            return_data["state"]="RINI";
            conn.sendText(JSON.stringify(return_data));
        }

        if(received_message["state"]=="LOG"){
            if(received_message["userid"]==-1)
            {
                all_data["user_socket"][userCnt]=conn; //存socket
                all_data["user_state"]="LOG";
                all_data["user_name"][userCnt]=received_message["username"]; 
                return_data["state"]="RLOG";
                return_data["userid"]=userCnt;
    
                conn.sendText(JSON.stringify(return_data));
                userCnt++;
            }
        }

        if(received_message["state"]=="JOI"){
            var roomid=received_message["roomid"];
            if(all_data["room_num"][roomid]>=ROOM_SIZE){ //人已经满了 返回RJOI和error
                return_data["state"]="RJOI";
                return_data["error"]=true;
                conn.sendText(JSON.stringify(return_data));
                return;
            }

            var flag=false; //是否已经在某个房间
            var tmp_roomid;
            var tmp_roomnum;

            var old_roomid=all_data["user_roomid"][received_message["userid"]];
            console.log(old_roomid);
            if(old_roomid==-1)
            {
                all_data["room_info"][roomid][ all_data["room_num"][roomid] ]=received_message["userid"];
                all_data["room_num"][roomid]++; //房间中num++
                all_data["user_roomid"][received_message["userid"]]=roomid; //保存每个用户的roomid
            }
            else
            {
                flag=true;
                tmp_roomid=old_roomid;
                tmp_roomnum=all_data["room_num"][old_roomid]-1;
                for(let i=0;i<all_data["room_num"][old_roomid];i++){
                    if(all_data["room_info"][roomid][i]==received_message["userid"]){
                        for(let j=i+1;j<all_data["room_num"][old_roomid];j++){
                            all_data["room_info"][roomid][j-1]=all_data["room_info"][roomid][j];
                        }
                        break;
                    }
                }
                all_data["room_num"][old_roomid]--;

                all_data["room_info"][roomid][ all_data["room_num"][roomid] ]=received_message["userid"];
                all_data["room_num"][roomid]++; //房间中num++
                all_data["user_roomid"][received_message["userid"]]=roomid; //保存每个用户的roomid
            }
            //console.log(all_data["room_num"][roomid]);
            //如果没满，则转发更新人数
            //如果满了，则开始游戏

            if(all_data["room_num"][roomid]<ROOM_SIZE)
            {
                return_data["state"]="RJOI";
                return_data["roomid"]=roomid;
                return_data["roomnum"]=all_data["room_num"][roomid];
                //转发更新状态
                for(let i=0;i<userCnt;i++){
                    if(all_data["user_state"][i]!="disconn") //没断开
                    {
                        all_data["user_socket"][i].sendText(JSON.stringify(return_data));
                    }
                }
                if(flag==true){
                    return_data["state"]="RJOI";
                    return_data["roomid"]=tmp_roomid;
                    return_data["roomnum"]=tmp_roomnum;
                    for(let i=0;i<userCnt;i++){
                        if(all_data["user_state"][i]!="disconn") //没断开
                        {
                            all_data["user_socket"][i].sendText(JSON.stringify(return_data));
                        }
                    }
                }
            }
            else{
                return_data["state"]="RJOI";
                return_data["roomid"]=roomid;
                return_data["roomnum"]=all_data["room_num"][roomid];
                //转发更新状态
                for(let i=0;i<userCnt;i++){
                    if(all_data["user_state"][i]!="disconn") //没断开
                    {
                        all_data["user_socket"][i].sendText(JSON.stringify(return_data));
                    }
                }
                if(flag==true){
                    return_data["state"]="RJOI";
                    return_data["roomid"]=tmp_roomid;
                    return_data["roomnum"]=tmp_roomnum;
                    for(let i=0;i<userCnt;i++){
                        if(all_data["user_state"][i]!="disconn") //没断开
                        {
                            all_data["user_socket"][i].sendText(JSON.stringify(return_data));
                        }
                    }
                }

                //开始
                return_data["state"]="READY";
                //开始的时候给出同房间 用户名s
                for(let i=0;i<ROOM_SIZE;i++){
                    var tmp_uid=all_data["room_info"][roomid][i];
                    return_data["names"][i]=all_data["user_name"][tmp_uid];
                }
                for(let i=0;i<ROOM_SIZE;i++){
                    var tmp_uid=all_data["room_info"][roomid][i];
                    return_data["user_roomid"]=i; //开始的时候给一个房间里的id
                    all_data["user_socket"][tmp_uid].sendText(JSON.stringify(return_data));
                }
            }
        }
        if(received_message["state"]=="RUN"){
            return_data["state"]="RRUN";
            return_data["board"]=received_message["board"];
            return_data["score"]=received_message["score"];
            return_data["user_roomid"]=received_message["user_roomid"];
            var roomid=received_message["roomid"];
            for(let i=0;i<ROOM_SIZE;i++){
                var tmp_uid=all_data["room_info"][roomid][i];
                all_data["user_socket"][tmp_uid].sendText(JSON.stringify(return_data));
            }
        }
    }
    );
    conn.on("close", function (code, reason) {
        console.log("关闭连接")
    });
    conn.on("error", function (code, reason) {
        console.log("异常关闭")
    });
}).listen(8001)
console.log("WebSocket建立完毕")
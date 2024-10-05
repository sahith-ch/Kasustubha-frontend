"use client";
import { getAllAppointment } from "@/actions/appointment/getOppintments";
import { useUser } from "@/app/context/userContext";
import { useMail } from "@/components/chat/chat";
import { ChatDisplay } from "@/components/chat/chatDisplay";
import ContactList from "@/components/chat/ContactList";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import React, { useEffect, useState, useCallback } from "react";
import { useCookies } from "react-cookie";
import { io } from "socket.io-client";

interface MailItem {
  id: string;
  creator: {
    name: string;
  };
  read: boolean;
  updated_at: string;
  labels: string[];
}
interface Message {
  id: number;
  content: string;
  senderId: string;
  sender:{
    name:string;
  }
  senderName:string
  createdAt: string;
  filePath?: string;
  fileType?: string;
  fileName?: string;
}



const defaultLayout = [265, 360, 655]
const socket = io("wss://mtapi.adarsh.tech");

const Page = () => {
  const [mail,setMail] = useMail();
  const { id ,role} = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [message, setMessage] = useState([]);
  const [sheetState, setSheetState] = useState(false);
  const [list, setList] = useState<any[]>([]);

  const [cookie, setCookie] = useCookies([
    "react-resizable-panels:collapsed",
    "react-resizable-panels:layout",
  ]);
  

  // const GetMessages = useCallback(async () => {
  //   if (!mail.selected) {
  //     return;
  //   }
  //   let data = await fetch(
  //     `https://devapi.beyondchats.com/api/get_chat_messages?chat_id=${mail.selected}`
  //   );
  //   data = await data.json();
  //   console.log("messages = ",data)
  // }, [mail.selected]);

  const [doctorId,setdoctorId] = useState<string|null>("");
  const [clientId,setclientId] = useState<string|null>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [convoId,setConvoId] = useState<any>("")
const [messageCount,setmessageCount]=useState(0)
const [isVideoCallActive, setIsVideoCallActive] = useState<boolean>(false);
const [isReceivingCall, setIsReceivingCall] = useState(false);
const [caller, setCaller] = useState("");
const [callerSignal, setCallerSignal] = useState(null);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let doctorId = role === "DOCTOR" ? id : mail.selected;
    let clientId = role === "DOCTOR" ? mail.selected : id;
    setdoctorId(doctorId)
    setclientId(clientId)

  
    const roomId = `room_${doctorId}_${clientId}`;
    console.log(mail.type)
    if(mail.type==="COMMUNITY"){
      let userId  = id;
     
      const conversationId = mail.selected
      console.log("convoid ",conversationId)
    socket.emit("joinCommunity", { conversationId, userId });
      
    }else{
    socket.emit("joinRoom", { doctorId, clientId });
    

    }
    socket.on("conversationId", (Dataid) => {
      setConvoId(Dataid); // Store the received convoId
      console.log("Received conversationId:", Dataid);

    });
    socket.on("previousMessages", (previousMessages:any) => {
      console.log("prev",previousMessages)
      setMessages(previousMessages.message);
      setmessageCount(previousMessages.unreadCount)
    });
    socket.on("callEnded", handleCallEnded);
    socket.on("callDeclined", handleCallEnded);
    socket.on("callUser", handleIncomingCall);
    socket.emit("getsetId", { userId: id });

    socket.on("receivedMessage", (newMessage: Message) => {
      console.log("rec",newMessage)
      setMessages((prevMessages) => {
        if (!prevMessages.some(msg => msg.id === newMessage.id)) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    });


 

    return () => {
     socket.off("previousMessages");
      socket.off("receivedMessage");
      socket.off("conversationId");

    };
  }, [doctorId, clientId,mail.selected]);

  const getAllAppointments = async () => {
    const data = await getAllAppointment(id,role);
    console.log("da",data)
    if (data.data && data.data?.length) {
      setList(data.data);
      console.log("d",data)
    }
  };

  let reqid;

  const handleAcceptCall = () => {
    setIsReceivingCall(false);
  };

  const handleDeclineCall = () => {
    setIsReceivingCall(false);
    setIsVideoCallActive(false);
    socket.emit("declineCall", { to: caller });
  };

  const handleCallEnded = () => {
    setIsVideoCallActive(false);
    setIsReceivingCall(false);
    setCaller("");
    setCallerSignal(null);
  };

  const handleIncomingCall = (data: { from: string; name: string; signal: any }) => {
    setIsReceivingCall(true);
    setCaller(data.from);
    setCallerSignal(data.signal);
    setIsVideoCallActive(true);
  };


  useEffect(() => {

    // Cleanup listener on component unmount
    return () => {
      socket.off("conversationId");
    };
},[])
  useEffect(() => {
    getAllAppointments();
  }, []);

  const updateSheetState = (val: boolean) => {
    setSheetState(val);
  };

  return (
    <div className="w-full h-full p-4">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          setCookie("react-resizable-panels:layout", JSON.stringify(sizes));
        }}
        className="h-full max-h-[800px] border rounded-lg items-stretch"
      >
        {isMobile && mail.selected ? null : (
          <ResizablePanel defaultSize={23} minSize={25} maxSize={35}>
            <ContactList socket={socket} messageCount={messageCount} sheetState={sheetState} items={list} />
          </ResizablePanel>
        )}
        {!isMobile && <ResizableHandle withHandle />}
        {isMobile ? (
          mail.selected ? (
            <ResizablePanel defaultSize={defaultLayout[2]}>
              <ChatDisplay handleAcceptCall={handleAcceptCall}  setMessages={setMessages} caller={caller} callerSignal={callerSignal} isReceivingCall={isReceivingCall} setIsVideoCallActive={setIsVideoCallActive} isVideoCallActive={isVideoCallActive} socket={socket} doctorId={doctorId} clientId={clientId} convoId = {convoId} messages={messages} removedata={() => setMessage([])} />
              </ResizablePanel>
          ) : null
        ) : (
          <ResizablePanel defaultSize={defaultLayout[2]}>
              <ChatDisplay handleAcceptCall={handleAcceptCall} setMessages={setMessages} caller={caller} callerSignal={callerSignal} isReceivingCall={isReceivingCall} setIsVideoCallActive={setIsVideoCallActive} isVideoCallActive={isVideoCallActive} socket={socket} doctorId={doctorId} clientId={clientId} convoId = {convoId} messages={messages} removedata={() => setMessage([])} />
              </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default Page;


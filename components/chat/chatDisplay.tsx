import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Search,
  Smile,
  X,
  Loader,
  FileIcon,
  Video
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { format, isSameDay } from "date-fns";
import { useMail } from "./chat";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { useUser } from "@/app/context/userContext";
import VideoCall from "./VideoCall";
import NoChatSelected from './NoChatSelected';

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


export function ChatDisplay({ socket,setMessages,isVideoCallActive,handleDeclineCall,isReceivingCall,handleAcceptCall,caller,callerSignal ,setIsVideoCallActive,messages,doctorId,convoId,clientId, removedata }: any) {
  const [mail, setMail] = useMail();
  const [message, setMessage] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { id, role } = useUser();

  const lastSeenMessageRef = useRef<number | null>(null);

  const startVideoCall = () => {
    setIsVideoCallActive(true);
  };
  let reqid:any;

  useEffect(() => {
    
   
    socket.on('messagesSeen', ({ userId, lastSeenMessageId, updatedMessages }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id <= lastSeenMessageId
            ? updatedMessages.find((updatedMsg: Message) => updatedMsg.id === msg.id) || msg
            : msg
        )
      );
    });
    

    return () => {
      socket.off("previousMessages");

      socket.off("conversationId");
      socket.off("callUser");
      socket.off("callEnded");
      socket.off("callDeclined");
      socket.off("messagesSeen");
    };
  }, [id, mail.selected, role, socket]);

const conversationType = mail.type === "COMMUNITY" ? "COMMUNITY" : "PRIVATE";
const roomId = conversationType === "PRIVATE" ? `room_${doctorId}_${clientId}` : convoId;
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.id !== lastSeenMessageRef.current) {
      lastSeenMessageRef.current = lastMessage.id;
      socket.emit('markAsSeen', {
        userId: id,
        conversationId: convoId,
        lastSeenMessageId: lastMessage.id
      });
    }
  }, [messages, id, convoId, socket]);
  reqid =conversationType === "PRIVATE" ?convoId:mail.selected

  const sendMessage = () => {
   
    //const conversationType = mail.type === "COMMUNITY" ? "COMMUNITY" : "PRIVATE";
   // const roomId = conversationType === "PRIVATE" ? `room_${doctorId}_${clientId}` : convoId;
reqid =conversationType === "PRIVATE" ?convoId:mail.selected
  console.log('Sending message with convoId:', convoId); // Debugging log

    socket.emit("sendMessage", {
      conversationType,
      conversationId: reqid, // Use the stored convoId
      roomId,
      message,
      senderId: role === "DOCTOR" ? doctorId : clientId,
    });

    setMessage(""); // Clear the message input

}
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files && event.target.files[0]) {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }
};
console.log("URL = ",previewUrl)
const uploadFile = async () => {
  if (!file) return;

  setIsLoading(true);
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://mtapi.adarsh.tech/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.filePath) {
      console.log("Sending data:", {
        conversationType,
        conversationId: reqid,
        roomId,
        filePath: data.filePath,
        senderId: role === "DOCTOR" ? doctorId : clientId,
        fileType: file.type,
        fileName: file.name,
      });

      socket.emit("fileUpload", {
        conversationType,
        conversationId:reqid,
        roomId,
        filePath: data.filePath,
        senderId: role === "DOCTOR" ? doctorId : clientId,
        fileType: file.type,
        fileName: file.name,
      });
 
      setFile(null);
      setPreviewUrl(null);
    socket.off("fileUpload");
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    // Handle the error (e.g., show an error message to the user)
  } finally {
    setIsLoading(false);
  }
};
const handleEmojiClick = (event: any) => {
  setOpen(false);
  setMessage((prev) => prev + event.emoji);
};
const cancelFileUpload = () => {
  setFile(null);
  setPreviewUrl(null);
};

const Remove = () => {
  setMail({ selected: null, name: "" });
  removedata();
};

useEffect(() => {
  setOpen(false);
  setMessage("");
}, [removedata, messages]);
const renderFilePreview = (filePath: string, fileType: string, fileName: string) => {
  if (fileType.startsWith('image/')) {
    return (
      <div className="relative w-48 h-48 bg-muted rounded-md overflow-hidden">
        <img src={filePath} alt={fileName} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs truncate">
          {fileName}
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
        <FileIcon size={24} />
        <a href={filePath} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate max-w-[200px]">
          {fileName || "View File"}
        </a>
      </div>
    );
  }
}

console.log("message",messages)
  console.log("here=",mail) 
 if(mail.selected)
  return (
    
   <div className="flex relative  h-full flex-col">
     {isVideoCallActive ? (
        <div className="fixed inset-0 z-50 bg-background">
          <VideoCall
            socket={socket}
            setIsVideoCallActive={setIsVideoCallActive}
            clientId={clientId}
            doctorId={doctorId}
            isReceivingCall={isReceivingCall}
            caller={caller}
            callerSignal={callerSignal}
            onAcceptCall={handleAcceptCall}
            onDeclineCall={handleDeclineCall}
          />
        </div>
      ) : (
        <>
        
        <div className="flex items-center h-16 p-3">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!mail}
                    onClick={Remove}
                  >
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Back</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>
              {mail.name && (
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    className="rounded-full"
                    src={`https://avatar.iran.liara.run/username?username=${mail.name}`}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              )}
              <span className="text-sm font-medium">{mail.name}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Search size={20} />
              <Tooltip>
                <TooltipTrigger asChild>
            {conversationType!=="COMMUNITY"?
                  (<Button
                    variant="ghost"
                    size="icon"
                    onClick={startVideoCall}
                    disabled={!mail.selected}
                  >
                    <Video className="h-5 w-5" />
                    <span className="sr-only">Start Video Call</span>
                  </Button>
                  ):<></>}
                </TooltipTrigger>
                <TooltipContent>Start Video Call</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail.selected}>
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="flex flex-col gap-1 bg-muted"
                >
                  <DropdownMenuItem>Mute</DropdownMenuItem>
                  <DropdownMenuItem>Select Messages</DropdownMenuItem>
                  <DropdownMenuItem>Report</DropdownMenuItem>
                  <Separator />
                  <DropdownMenuItem className="text-red-500">
                    Delete chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
 {/* Chat messages */}
 <Separator />
 <ScrollArea className="h-[calc(100%-96px)] relative overflow-auto">
 <div className="flex lg:w-[70%] mx-auto p-4 pb-8 gap-2 flex-col">
   {messages?.length > 0 ? (
     messages?.map((item, index) => {
       const currentDate = new Date(item.createdAt);
       const previousDate =
         index > 0 ? new Date(messages[index - 1].createdAt) : null;
       const showDateSeparator =
         !previousDate || !isSameDay(currentDate, previousDate);
       const isCurrentUser = item.senderId === (role === "DOCTOR" ? doctorId : clientId);
       const isLastMessage = index===messages.length-1;
       return (
         <div key={item.id}>
           {showDateSeparator && (
             <div className="w-full h-10 flex flex-col justify-center items-center my-2">
               <Separator />
               <span className="text-sm text-muted-foreground">
                 {format(currentDate, "MMMM d, yyyy")}
               </span>
             </div>
           )}
           <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
             <div
               className={`lg:max-w-[40%] max-w-[80%] px-2 py-1 font-normal rounded-t-md ${
                 isCurrentUser
                   ? "rounded-l-md bg-primary text-white"
                   : "rounded-r-md bg-muted text-foreground"
               }`}
             >
               <div className="text-sm font-semibold flex justify-end items-end text-white-600 mb-1">
                 {item.sender?.name}
               </div>
               {item.filePath ? (
                 renderFilePreview(item.filePath, item.fileType || '', item.fileName || '')
               ) : (
                 <p>{item.content}</p>
               )}

               <div className="w-full flex justify-end">
                 <p className="text-[10px] opacity-85">
                   {format(currentDate, "p")}
                 </p>
               </div>
             </div>
           </div>
           {isLastMessage && (
             (() => {
               const targetUserId = role === "DOCTOR" ? clientId : doctorId;
               const seenTime = item.seenBy?.find(seen => seen.userId === targetUserId)?.seenAt;

               if (seenTime) {
                 return (
                   <div className="text-xs text-gray-500 text-right">
                     Seen at {format(new Date(seenTime), "p")}
                   </div>
                 );
               }

               return null;
             })()
           )}
         </div>
       );
     })
   ) : (
     <div className="p-8 text-center text-muted-foreground">
       No messages selected
     </div>
   )}
 </div>
</ScrollArea>

{/* Input area */}
{mail.selected && (
 <div className="sticky right-0 lg:h-24 lg:bg-background bottom-0 w-full flex items-start justify-center">
   <div className="flex gap-2 h-14 items-center w-full lg:w-[70%] py-3 px-4 bg-muted lg:rounded-t-md lg:rounded-l-md">
     {previewUrl ? (
       // If a file is selected, show the preview and upload button
       <>
         <div className="relative w-14 h-14">
           <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
           <button
             onClick={cancelFileUpload}
             className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
           >
             <X size={16} />
           </button>
         </div>

         <Button
           variant="outline"
           className="text-muted-foreground w-[40%] bg-muted"
           onClick={uploadFile}
           disabled={isLoading}
         >
           {isLoading ? <Loader className="animate-spin" /> : "Upload"}
         </Button>
       </>
     ) : (
       // If no file is selected, show the message input and file selection option
       <>
         <Popover open={open}>
           <PopoverTrigger asChild>
             <Smile size={25} onClick={() => setOpen(true)} />
           </PopoverTrigger>
           <PopoverContent>
             <EmojiPicker onEmojiClick={handleEmojiClick} />
           </PopoverContent>
         </Popover>

         <Input
           placeholder="Type a message..."
           className="bg-background"
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === "Enter") sendMessage();
           }}
         />

         <label htmlFor="file-upload">
           <Paperclip size={25} className="cursor-pointer" />
         </label>
         <input
           type="file"
           accept="image/*"
           onChange={handleFileChange}
           className="hidden"
           id="file-upload"
         />

         <Button
           variant="outline"
           className="text-muted-foreground w-[40%] bg-muted"
           onClick={sendMessage}
           disabled={isLoading}
         >
           {isLoading ? <Loader className="animate-spin" /> : "Send"}
         </Button>
       </>
     )}
   </div>
 </div>
)}
     </>
      )}

</div>

)
else{
  return(
    <NoChatSelected/>
  )
}

}
  

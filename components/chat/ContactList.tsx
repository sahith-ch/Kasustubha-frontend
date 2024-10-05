

import React, { useEffect, useState } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useMail } from './chat';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useUser } from '@/app/context/userContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { getAllDoctorsWithDetails } from '@/actions/consult/consultDoc';
import { getAllDoctors } from '@/actions/chat/GetAllDoctors';
import { Socket } from 'socket.io-client';
import { GetCommunityConversations } from '@/actions/chat/GetCommunityConversatons';

interface MailItem {
    userId: string;
    name:string;
      doctorName: string;
      doctor_id:string
    id:string
    read: boolean;
    date: string;
    labels: string[];
    role:string
  }
  
  interface ChatListProps {
    items: MailItem[];
    sheetState:boolean
    socket:Socket,
    messageCount:any

  }

const ContactList = ({socket, items,sheetState,messageCount }: ChatListProps) => {
  const {id,role} = useUser()
    const [mail, setMail] = useMail();
    const [members,setmembers] = useState<any>([]);

    const [randomNumber, setRandomNumber] = useState(0);
    const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
    const [newCommunityName, setNewCommunityName] = useState('');
    const [communityMembers, setCommunityMembers] = useState<string[]>([]);
    const [isCommunityView, setIsCommunityView] = useState(false);
    const [combinedData, setCombinedData] = useState<MailItem[]>([]); // State to store combined items and fetched doctors
    const [communities,setCommunities] = useState([])
    const [comunitymembersNames,setcomunitymembersNames] = useState([])
    console.log("type = ",items )
  
    const GetAllDoctorsWithDetails = async () => {
      const [doctors] = await getAllDoctors();
      const doctorIds = doctors.map((doc):any => ({id:doc.id,name:doc.name,role:doc.role}));
      const userIds = items.map(item => ({id:item.userId,name:item.name,role:item.role}));
      if (doctors) {
        const combined = [...userIds, ...doctorIds];
        setCombinedData(combined); 
        console.log(combined)

      }
    };
    const handleRemoveMember = (index: number) => {
      setCommunityMembers((prev) => prev.filter((_, i) => i !== index));
      setcomunitymembersNames((prev) => prev.filter((_, i) => i !== index));
    };
    
    useEffect(() => {
      if (items.length > 0) {
        GetAllDoctorsWithDetails();

      }
    }, [items]);;
    const GetCommunities = async()=>{
      const data = await GetCommunityConversations(id)
      setCommunities(data)
      console.log("communities ",data)
    }
    useEffect(() => {
  GetCommunities()
  
    }, [isCommunityView]); 
  
    const doctorsAndPatients = [
      { id: '1', name: 'Dr. John Doe' },
      { id: '2', name: 'Dr. Jane Smith' },
      { id: '3', name: 'Patient Alice' },
      { id: '4', name: 'Patient Bob' },
      { id: '5', name: 'Dr. John Doe' },
      { id: '6', name: 'Dr. Jane Smith' },
      { id: '7', name: 'Patient Alice' },
      { id: '8', name: 'Patient Bob' },
      { id: '9', name: 'Dr. John Doe' },
      { id: '10', name: 'Dr. Jane Smith' },
      { id: '11', name: 'Patient Alice' },
      { id: '12', name: 'Patient Bob' },
      { id: '13', name: 'Dr. John Doe' },
      { id: '24', name: 'Dr. Jane Smith' },
      { id: '15', name: 'Patient Alice' },
      { id: '16', name: 'Patient Bob' },
    ];

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState(doctorsAndPatients);
    
  useEffect(() => {
    setFilteredSuggestions(
      combinedData.filter((person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm]);

  const handleCreateCommunity = () => {
    const updatedMembers = [...communityMembers, id];
    console.log('Creating community with:', newCommunityName, updatedMembers);
  
    // Emit the socket event
    socket.emit("createCommunity", { newCommunityName, communityMembers: updatedMembers });
   
    
    setCommunityMembers(updatedMembers);
    setIsCreatingCommunity(false);
  

    // Optionally, reset the community name
    setNewCommunityName('');
    GetCommunities();

  };
 
  const handleSelectSuggestion = (selection: any) => {

    setCommunityMembers((prev) => [...prev, selection.id]);
    
    setcomunitymembersNames((prev)=>[...prev,selection.name])
    setSearchTerm('');
  };
console.log("Comunitynames",comunitymembersNames)
if(role!="DOCTOR"){
  return (
    <div className="h-full w-full"> 
        <div className="flex justify-center p-4">

<Button onClick={() => {
  setIsCommunityView(!isCommunityView);
  setMail({
    ...mail,
    selected: "",
    name: "",
    type: ""
  });
}}>
  {isCommunityView ? 'Switch to User Chats' : 'Switch to Community Chats'}
</Button>
</div>
      <ScrollArea className="h-[calc(100%-128px)]">
    {!isCommunityView?
    <div className="origin-top-right flex flex-col mt-4 p-3 pt-0">
      {items?.map((item,index) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg p-2 text-left text-sm transition-all",mail.selected !== item.id&&"hover:bg-muted",
            mail.selected === item.id && "bg-primary",
          )}
          onClick={() =>
           
            setMail({
              ...mail,
              selected: item.doctor_id,
              name:item.doctorName,
              type:"PRIVATE"
            })
            // socket.emit('resetUnreadCount', { userId: id, conversationId: item.id })

          }
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage
                className="rounded-full"
                  src={`https://avatar.iran.liara.run/username?username=${item.doctorName || "Default Name"}`}
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className={`flex w-[calc(100%-70px)] ${mail.selected?'':'border-b'} mt-1 gap-2`}>
               <div>
               <h3 className={cn(
                  "font-medium text-[14px]",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-forground",
                )}>{item.doctorName||"User "+index}</h3>
               
               </div>
                <div
                className={cn(
                  "ml-auto text-xs flex flex-col items-end gap-1",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-muted-foreground",
                )}
              >
                
                {/* {console.log(item?.date)}
                {
                
                formatDistanceToNow(new Date(item.date), {
                  addSuffix: true,
                })} */}
                
                {/* {mail.selected !== item.id&&<span><Badge className=" scale-75">{messageCount}</Badge></span>} */}
              </div>
              </div>
             
            </div>
          </div>
        </button>
      ))}
    </div>: <div className="origin-top-right flex flex-col mt-4 p-3 pt-0">
    {communities?.map((item,index) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg p-2 text-left text-sm transition-all",mail.selected !== item.id&&"hover:bg-muted",
            mail.selected === item.id && "bg-primary",
          )}
          onClick={() =>
            setMail({
              ...mail,
              selected: item?.id,
              name:item?.communityName,
              type:item?.type
            })
          }
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage
                className="rounded-full"
                  src={`https://avatar.iran.liara.run/username?username=${item.CommunityName || "Default Name"}`}
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className={`flex w-[calc(100%-70px)] ${mail.selected?'':'border-b'} mt-1 gap-2`}>
               <div>
               <h3 className={cn(
                  "font-medium text-[14px]",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-forground",
                )}>{item.communityName||"User "+index}</h3>
               
               </div>
                <div
                className={cn(
                  "ml-auto text-xs flex flex-col items-end gap-1",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-muted-foreground",
                )}
              >
                
                {/* {console.log(item?.date)}
                {
                
                formatDistanceToNow(new Date(item.date), {
                  addSuffix: true,
                })} */}
                
               {/* {mail.selected !== item.id&&<span><Badge className=" scale-75">{messageCount} </Badge></span>} */}
              </div>
              </div>
             
            </div>
          </div>
        </button>
      ))}
      </div>}
  </ScrollArea>
  <div className='w-full h-16 flex items-center justify-center px-4 border-t' >
   <Input placeholder='Search name' ></Input>
  </div>
  
  </div>
  )
}
else{
  return (
    <div className="h-full w-full"> 
        <div className="flex justify-center p-4">
        <Button onClick={() => {
  setIsCommunityView(!isCommunityView);
  setMail({
    ...mail,
    selected: "",
    name: "",
    type: ""
  });
}}>
  {isCommunityView ? 'Switch to User Chats' : 'Switch to Community Chats'}
</Button>
      </div>
      <Dialog open={isCreatingCommunity} onOpenChange={setIsCreatingCommunity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Community</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Input
              placeholder="Community Name"
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Search for doctors or patients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            {searchTerm && (
              <div className="suggestions-list">
                {filteredSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="suggestion-item cursor-pointer hover:bg-muted"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.name}
                  </div>
                ))}
              </div>
            )}
<div className="selected-members mt-4 flex flex-row flex-wrap gap-2">
  {comunitymembersNames?.map((member, index) => (
    <div
      key={index}
      className="flex items-center space-x-2 bg-purple-600 text-white rounded-full px-4 py-2"
    >
      <span>{member}</span>
      <button
        onClick={() => handleRemoveMember(index)} // Create a remove function
        className="text-white bg-red-600 rounded-full w-6 h-6 flex justify-center items-center"
      >
        &times;
      </button>
    </div>
  ))}
</div>

          </div>
          <DialogFooter>
            <Button onClick={handleCreateCommunity}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ScrollArea className="h-[calc(100%-192px)]">
   {!isCommunityView?
   <div className="origin-top-right flex flex-col mt-4 p-3 pt-0">
      {items?.map((item,index) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg p-2 text-left text-sm transition-all",mail.selected !== item.id&&"hover:bg-muted",
            mail.selected === item.id && "bg-primary",
          )}
          onClick={() =>{
            setMail({
              ...mail,
              selected: item.userId,
              name:item.name,
              type:"PRIVATE"
            })
          }
        }
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage
                className="rounded-full"
                  src={`https://avatar.iran.liara.run/username?username=${item.name || "Default Name"}`}
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className={`flex w-[calc(100%-70px)] ${mail.selected?'':'border-b'} mt-1 gap-2`}>
               <div>
               <h3 className={cn(
                  "font-medium text-[14px]",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-forground",
                )}>{item.name||"User "+index}</h3>
               
               </div>
                <div
                className={cn(
                  "ml-auto text-xs flex flex-col items-end gap-1",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-muted-foreground",
                )}
              >
                
                {/* {console.log(item?.date)}
                {
                
                formatDistanceToNow(new Date(item.date), {
                  addSuffix: true,
                })} */}
                
                {/* {mail.selected !== item.id&&<span><Badge className=" scale-75">{messageCount} </Badge></span>} */}
              </div>
              </div>
             
            </div>
          </div>
        </button>
      ))}
    </div>:  <div className="origin-top-right flex flex-col mt-4 p-3 pt-0">
    {communities?.map((item,index) => (
        <button
          key={item.id}
          className={cn(
            "flex flex-col items-start gap-2 rounded-lg p-2 text-left text-sm transition-all",mail.selected !== item.id&&"hover:bg-muted",
            mail.selected === item.id && "bg-primary",
          )}
          onClick={() =>
            setMail({
              ...mail,
              selected: item?.id,
              name:item.communityName,
              type:item.type
            })
          }
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex gap-2">
              <Avatar className="h-12 w-12">
                <AvatarImage
                className="rounded-full"
                  src={`https://avatar.iran.liara.run/username?username=${item.CommunityName || "Default Name"}`}
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className={`flex w-[calc(100%-70px)] ${mail.selected?'':'border-b'} mt-1 gap-2`}>
               <div>
               <h3 className={cn(
                  "font-medium text-[14px]",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-forground",
                )}>{item.communityName||"User "+index}</h3>
               
               </div>
                <div
                className={cn(
                  "ml-auto text-xs flex flex-col items-end gap-1",
                  mail.selected === item.id
                    ? "text-white"
                    : "text-muted-foreground",
                )}
              >
                
                {/* {console.log(item?.date)}
                {
                
                formatDistanceToNow(new Date(item.date), {
                  addSuffix: true,
                })} */}
                
                {/* {mail.selected !== item.id&&<span><Badge className=" scale-75">{messageCount}</Badge></span>} */}
              </div>
              </div>
             
            </div>
          </div>
        </button>
      ))}
      </div>}
      </ScrollArea>
  <div className='w-full h-16 flex items-center justify-center px-4 border-t' >
   <Input placeholder='Search name' ></Input>
  </div>
  {role === 'DOCTOR' && (
        <div className="w-full h-16 flex items-center justify-center px-4 border-t">
          <button
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            onClick={() => setIsCreatingCommunity(true)}
          >
            Create Community
          </button>
        </div>
      )}
  </div>
  )
}
}

export default ContactList

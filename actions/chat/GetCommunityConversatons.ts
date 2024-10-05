"use server";

import { useUser } from "@/app/context/userContext";
import { db } from "@/lib/db";
export const GetCommunityConversations = async (userId: string) => {
    try {
        // Fetch all conversation participants for the user
        const participantRecords = await db.conversationParticipant.findMany({
            where: {
                userId: userId, // Filter by the user's ID
            },
            include: {
                conversation: {
                    select: {
                        id: true, // Include conversation ID
                        communityName: true, // Include the community name
                        type: true, // Include the conversation type (should be COMMUNITY)
                    },
                },
            },
        });

        // Filter out conversations of type "COMMUNITY"
        const communityConversations = participantRecords
            .map(participant => participant.conversation)
            .filter(conversation => conversation.type === 'COMMUNITY');

        return communityConversations;
    } catch (error) {
        console.error('Error fetching user communities:', error);
        throw error;
    }
};

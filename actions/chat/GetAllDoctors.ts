"use server";

import { db } from "@/lib/db";

export const getAllDoctors = async () => {
    try {
      const doctors = await db.user.findMany({
        where: {
          role: 'DOCTOR',
        },
      });
  
     return([doctors])
  }catch (error) {
      console.error('Error fetching doctors with details:', error);
      return null;
    }
}
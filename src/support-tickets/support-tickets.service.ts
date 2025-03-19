import db from "../drizzle/db";
import { SupportTicketsTable, UsersTable, ticketStatusEnum } from "../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

// Define the valid status type using the enum values
type TicketStatus = typeof ticketStatusEnum.enumValues[number];

export type SupportTicketWithUser = {
  ticketId: number;
  userId: number;
  subject: string;
  message: string;
  status: string;
  adminResponse: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  user: {
    fullName: string;
    email: string;
  };
};

export const supportTicketService = {
  // Get all tickets with user information
  list: async (): Promise<SupportTicketWithUser[]> => {
    const tickets = await db.query.SupportTicketsTable.findMany({
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(SupportTicketsTable.createdAt)],
    });

    return tickets as SupportTicketWithUser[];
  },

  // Get tickets for a specific user
  listByUser: async (userId: number): Promise<SupportTicketWithUser[]> => {
    const tickets = await db.query.SupportTicketsTable.findMany({
      where: eq(SupportTicketsTable.userId, userId),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(SupportTicketsTable.createdAt)],
    });

    return tickets as SupportTicketWithUser[];
  },

  // Get ticket by ID
  getById: async (ticketId: number): Promise<SupportTicketWithUser | undefined> => {
    const ticket = await db.query.SupportTicketsTable.findFirst({
      where: eq(SupportTicketsTable.ticketId, ticketId),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return ticket as SupportTicketWithUser | undefined;
  },

  // Create a new ticket
  create: async (ticketData: {
    userId: number;
    subject: string;
    message: string;
    category: string;
  }) => {
    const [newTicket] = await db
      .insert(SupportTicketsTable)
      .values({
        userId: ticketData.userId,
        subject: ticketData.subject,
        message: ticketData.message,
        status: "new",
        category: ticketData.category,
      })
      .returning();

    return newTicket;
  },

  // Update a ticket
  update: async (
    ticketId: number,
    ticketData: {
      subject?: string;
      message?: string;
      status?: TicketStatus;
      adminResponse?: string;
      category?: string;
    }
  ) => {
    // Create the base update data
    const baseUpdateData = {
      ...ticketData,
      updatedAt: new Date(),
    };
    
    // If status is being updated to "resolved", create a new object with resolvedAt timestamp
    if (ticketData.status === "resolved") {
      const updateDataWithResolved = {
        ...baseUpdateData,
        resolvedAt: new Date(),
      };
      
      const [updatedTicket] = await db
        .update(SupportTicketsTable)
        .set(updateDataWithResolved)
        .where(eq(SupportTicketsTable.ticketId, ticketId))
        .returning();

      return updatedTicket;
    } else {
      // Normal update without resolvedAt
      const [updatedTicket] = await db
        .update(SupportTicketsTable)
        .set(baseUpdateData)
        .where(eq(SupportTicketsTable.ticketId, ticketId))
        .returning();

      return updatedTicket;
    }
  },

  // Delete a ticket
  delete: async (ticketId: number): Promise<boolean> => {
    const result = await db
      .delete(SupportTicketsTable)
      .where(eq(SupportTicketsTable.ticketId, ticketId))
      .returning();
    return result.length > 0;
  },

  // Get tickets by status
  getByStatus: async (status: TicketStatus): Promise<SupportTicketWithUser[]> => {
    const tickets = await db.query.SupportTicketsTable.findMany({
      where: eq(SupportTicketsTable.status, status),
      with: {
        user: {
          columns: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(SupportTicketsTable.createdAt)],
    });

    return tickets as SupportTicketWithUser[];
  },
};
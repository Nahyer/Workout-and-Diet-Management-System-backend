import { Context } from "hono";
import { supportTicketService } from "./support-tickets.service";
import { ticketStatusEnum } from "../drizzle/schema";

// Define the valid status type using the enum values
type TicketStatus = typeof ticketStatusEnum.enumValues[number];

export const listTickets = async (c: Context) => {
  try {
    const data = await supportTicketService.list();
    if (!data || data.length === 0) {
      return c.json({ message: "No tickets found" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const listUserTickets = async (c: Context) => {
  try {
    const userId = c.req.param("userId");
    const data = await supportTicketService.listByUser(Number(userId));
    if (!data || data.length === 0) {
      return c.json({ message: "No tickets found for this user" }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getTicketById = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const data = await supportTicketService.getById(Number(id));
    if (!data) {
      return c.json({ message: "Ticket not found" }, 404);
    }

    // If status is 'new' and it's being accessed (presumably by an admin),
    // update it to 'open' automatically
    if (data.status === "new") {
      // You might want to check if the user is an admin here
      // For this example, we're assuming this endpoint is admin-protected
      await supportTicketService.update(Number(id), { status: "open" });
      data.status = "open"; // Update the response data as well
    }

    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const createTicket = async (c: Context) => {
  try {
    const ticketData = await c.req.json();
    const newTicket = await supportTicketService.create(ticketData);
    return c.json(newTicket, 201);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const updateTicket = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const ticketData = await c.req.json();
    
    // Get the current ticket to handle special status transitions
    const currentTicket = await supportTicketService.getById(Number(id));
    if (!currentTicket) {
      return c.json({ message: "Ticket not found" }, 404);
    }

    const updatedTicket = await supportTicketService.update(Number(id), ticketData);
    if (!updatedTicket) {
      return c.json({ message: "Ticket not found" }, 404);
    }
    
    return c.json(updatedTicket, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 400);
  }
};

export const deleteTicket = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const deleted = await supportTicketService.delete(Number(id));
    if (!deleted) {
      return c.json({ message: "Ticket not found" }, 404);
    }
    return c.json({ message: "Ticket deleted successfully" }, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};

export const getTicketsByStatus = async (c: Context) => {
  try {
    const status = c.req.param("status");
    // Validate that status is one of the enum values
    if (!ticketStatusEnum.enumValues.includes(status as TicketStatus)) {
      return c.json({ message: "Invalid status parameter" }, 400);
    }
    
    const data = await supportTicketService.getByStatus(status as TicketStatus);
    if (!data || data.length === 0) {
      return c.json({ message: `No tickets with status: ${status}` }, 404);
    }
    return c.json(data, 200);
  } catch (error: any) {
    return c.json({ error: error?.message }, 500);
  }
};
import { Hono } from "hono";
import {
  listTickets,
  listUserTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketsByStatus,
} from "./support-tickets.controller";
import { zValidator } from "@hono/zod-validator";
import { supportTicketSchema, updateTicketSchema } from "../validators";

export const supportTicketRouter = new Hono();

// Admin routes
supportTicketRouter.get("/support-tickets", listTickets); // Get all tickets (admin)
supportTicketRouter.get("/support-tickets/status/:status", getTicketsByStatus); // Get tickets by status (admin)

// User routes
supportTicketRouter.get("/users/:userId/support-tickets", listUserTickets); // Get user's tickets

// Common routes
supportTicketRouter.get("/support-tickets/:id", getTicketById); // Get a specific ticket
supportTicketRouter.post("/support-tickets", zValidator("json", supportTicketSchema), createTicket); // Create a ticket
supportTicketRouter.put("/support-tickets/:id", zValidator("json", updateTicketSchema), updateTicket); // Update a ticket
supportTicketRouter.delete("/support-tickets/:id", deleteTicket); // Delete a ticket
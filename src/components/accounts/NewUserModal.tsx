import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client as ClientEntity } from "@/entities";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    role: "client",
    credit_limit: "0",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await ClientEntity.create({
        username: formData.username,
        full_name: formData.full_name,
        role: formData.role,
        credit_received: parseFloat(formData.credit_limit) || 0,
        credit_remaining: parseFloat(formData.credit_limit) || 0,
        cash: 0,
        pl_downline: 0,
        balance_upline: 0,
        status: "active",
        parent_username: "NomanSA8592", // Default for now
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClose();
      setFormData({
        username: "",
        full_name: "",
        role: "client",
        credit_limit: "0",
        password: "",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 uppercase tracking-tight">New User Registration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs font-bold uppercase text-slate-500">Username</Label>
            <Input
              id="username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-xs font-bold uppercase text-slate-500">Full Name</Label>
            <Input
              id="full_name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-xs font-bold uppercase text-slate-500">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit_limit" className="text-xs font-bold uppercase text-slate-500">Credit Limit</Label>
            <Input
              id="credit_limit"
              type="number"
              required
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
              placeholder="0"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              className="rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-lg px-6">
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-6 font-bold" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

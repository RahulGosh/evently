"use client"

import { useRouter } from "next/navigation";
import {useState} from "react"
import { useTransition } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteEvent } from "@/lib/actions/event.action";
import { Loader2 } from "lucide-react"; // Importing a loader icon

export const DeleteConfirmation = ({ eventId }: { eventId: string }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false); // State to control modal visibility
  
    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger>
          <Image src="/assets/icons/delete.svg" alt="delete" width={20} height={20} />
        </AlertDialogTrigger>
  
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription className="p-regular-16 text-grey-600">
              This action cannot be undone. The event will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
  
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} onClick={() => setIsOpen(false)}>
              Cancel
            </AlertDialogCancel>
  
            <AlertDialogAction
              onClick={() => {
                startTransition(async () => {
                  setIsOpen(true); // Keep modal open
                  await deleteEvent({ eventId, path: pathname });
                  setIsOpen(false); // Close only when deletion completes
                  router.refresh();
                });
              }}
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };
  
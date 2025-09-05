"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { eventFormSchema } from "@/lib/validator";
import * as z from "zod";
import { eventDefaultValues } from "@/constants";
import Dropdown from "./dropdown";
import { Textarea } from "../ui/textarea";
import ImageUpload from "./imageUpload";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/lib/actions/event.action";
import { Loader2, Trash2 } from "lucide-react";
import { Event } from "@prisma/client";
import {
  CreateCouponParams,
  getCouponsByEvent,
  deleteCoupon,
  addCouponsToEvent,
} from "@/lib/actions/coupon.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateEventParams } from "@/types";

type EventFormProps = {
  type: "Create" | "Update";
  userId: string;
  event?: Event;
  eventId?: string;
};

const EventForm = ({ type, userId, event, eventId }: EventFormProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coupons, setCoupons] = useState<CreateCouponParams[]>([]);
  const [existingCoupons, setExistingCoupons] = useState<any[]>([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  const [currentCoupon, setCurrentCoupon] = useState<CreateCouponParams>({
    code: "",
    discount: 0,
    isPercentage: true,
    maxUses: null,
    startDate: new Date(),
    endDate: null,
    eventId: eventId || "",
  });

  const router = useRouter();

  // Fetch existing coupons for update mode
  useEffect(() => {
    if (type === "Update" && eventId) {
      const fetchCoupons = async () => {
        setIsLoading(true);
        try {
          const fetchedCoupons = await getCouponsByEvent(eventId);
          setExistingCoupons(fetchedCoupons);
        } catch (error) {
          console.error("Error fetching coupons:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCoupons();
    }
  }, [eventId, type]);

  console.log(existingCoupons, "existingCoupons");
  console.log(eventId, "eventId");

  const initialValues = event
    ? {
        title: event.title,
        description: event.description ?? "",
        location: event.location || "",
        imageUrl: event.imageUrl,
        startDateTime: new Date(event.startDateTime),
        endDateTime: new Date(event.endDateTime),
        categoryId: event.categoryId,
        price: event.price,
        isFree: event.isFree,
        url: event.url || "",
        ticketsLeft: event.ticketsLeft ?? 10,
      }
    : {
        ...eventDefaultValues,
        ticketsLeft: 10,
      };

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
  });

 const addCoupon = () => {
  // Validate coupon inputs
  if (!currentCoupon.code.trim()) {
    alert("Coupon code is required");
    return;
  }

  // Ensure we have eventId for update mode
  if (type === "Update" && !eventId) {
    alert("Event ID is missing");
    return;
  }

  // Check if the coupon code already exists
  const isDuplicate = [...coupons, ...existingCoupons].some(
    (coupon) => coupon.code.toLowerCase() === currentCoupon.code.toLowerCase()
  );

  if (isDuplicate) {
    alert("Coupon code already exists");
    return;
  }

  // Create the coupon with the current eventId
  const newCoupon = {
    ...currentCoupon,
    eventId: eventId || currentCoupon.eventId // Use the prop if available
  };

  setCoupons([...coupons, newCoupon]);
  setCurrentCoupon({
    code: "",
    discount: 0,
    isPercentage: true,
    maxUses: null,
    startDate: new Date(),
    endDate: null,
    eventId: eventId || "" // Reset with current eventId
  });
  setShowCouponForm(false);
};

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;

    try {
      await deleteCoupon(couponToDelete);
      setExistingCoupons(
        existingCoupons.filter((coupon) => coupon.id !== couponToDelete)
      );
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }

    setShowDeleteDialog(false);
    setCouponToDelete(null);
  };

  const confirmDeleteCoupon = (couponId: string) => {
    setCouponToDelete(couponId);
    setShowDeleteDialog(true);
  };

  const uploadImagesToCloudinary = async (files: File[]) => {
    const uploadPreset = "evently";
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      try {
        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dv0yimv4z/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      } catch (error) {
        console.error(`Failed to upload image: ${file.name}`, error);
        throw error;
      }
    }

    return uploadedUrls;
  };

async function onSubmit(values: z.infer<typeof eventFormSchema>) {
  try {
    setIsSubmitting(true);
    
    let imageUrl = event?.imageUrl || "";
    
    if (files.length > 0) {
      const uploadedUrls = await uploadImagesToCloudinary(files);
      imageUrl = uploadedUrls[0];
    } else if (!event?.imageUrl) {
      form.setError("imageUrl", {
        type: "manual",
        message: "At least one image is required",
      });
      setIsSubmitting(false);
      return;
    }
    
    if (type === "Create") {
      const eventParams: CreateEventParams = {
          userId: userId,
          event: {
            title: values.title,
            description: values.description,
            location: values.location,
            imageUrl: imageUrl,
            startDateTime: values.startDateTime,
            endDateTime: values.endDateTime,
            categoryId: values.categoryId,
            price: values.price.toString(),
            isFree: values.isFree,
            url: values.url,
            ticketsLeft: values.ticketsLeft || 0,
          },
          path: "/",
        };
      
      const newEvent = await createEvent(
        eventParams,
        userId,
        imageUrl,
        coupons.length > 0 ? coupons : undefined
      );
      
      router.push("/");
    } else {
      if (!eventId) {
        console.error("Event ID is required for update");
        return;
      }
      
      // For update, first update the event
      const updatedEvent = await updateEvent(
        eventId,
        { ...values, imageUrl },
        userId
      );
      
      // Then add new coupons if any were added
      if (coupons.length > 0) {
        try {
          await addCouponsToEvent(eventId, coupons);
          console.log('Successfully added coupons to event');
        } catch (error) {
          console.error('Failed to add coupons:', error);
          // You might want to show an error message to the user
        }
      }
      
      router.push("/profile");
    }
  } catch (error) {
    console.error(`Failed to ${type.toLowerCase()} event:`, error);
  } finally {
    setIsSubmitting(false);
  }
}

  const handleFiles = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Event Title"
                      {...field}
                      className="input-field"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Dropdown
                      onChangeHandler={field.onChange}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description"
                    {...field}
                    className="textarea rounded-2xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={() => (
              <FormItem className="w-full">
                <FormLabel>Event Images</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-4">
                    {event?.imageUrl && files.length === 0 && (
                      <div className="relative h-[150px] w-[200px]">
                        <Image
                          src={event.imageUrl}
                          alt="Event image"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <ImageUpload
                      disabled={isSubmitting}
                      onChange={handleFiles}
                      onRemove={handleFileRemove}
                      value={files}
                      previewWidth={200}
                      previewHeight={150}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="w-full md:w-1/2">
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/location-grey.svg"
                        alt="location"
                        width={24}
                        height={24}
                      />
                      <Input
                        placeholder="Event location or Online"
                        {...field}
                        className="input-field"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticketsLeft"
              render={({ field }) => (
                <FormItem className="w-full md:w-1/2">
                  <FormLabel>Tickets Left</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Number of tickets available"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value) || 0)
                      }
                      className="input-field"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => field.onChange(date)}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MM/dd/yyyy h:mm aa"
                        wrapperClassName="datePicker"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <DatePicker
                        selected={field.value}
                        onChange={(date: Date | null) => field.onChange(date)}
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MM/dd/yyyy h:mm aa"
                        wrapperClassName="datePicker"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-5 md:flex-row">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/dollar.svg"
                        alt="dollar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        {...field}
                        className="p-regular-16 border-0 bg-grey-50 outline-offset-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={form.watch("isFree")}
                      />
                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex items-center">
                                <label
                                  htmlFor="isFree"
                                  className="whitespace-nowrap pr-3 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Free Ticket
                                </label>
                                <Checkbox
                                  onCheckedChange={field.onChange}
                                  checked={field.value}
                                  id="isFree"
                                  className="mr-2 h-5 w-5 border-2 border-primary-500"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/link.svg"
                        alt="link"
                        width={24}
                        height={24}
                      />
                      <Input
                        placeholder="URL"
                        {...field}
                        className="input-field"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Coupon Management Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Coupon Management</h3>

            {/* Add Coupon Form */}
            {showCouponForm && (
              <div className="p-4 border rounded-lg mb-4">
                <h3 className="font-medium mb-2">Add Coupon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Coupon Code"
                    value={currentCoupon.code}
                    onChange={(e) =>
                      setCurrentCoupon({
                        ...currentCoupon,
                        code: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Discount"
                    value={currentCoupon.discount}
                    onChange={(e) =>
                      setCurrentCoupon({
                        ...currentCoupon,
                        discount: Number(e.target.value),
                      })
                    }
                  />
                  <div className="flex items-center">
                    <Checkbox
                      checked={currentCoupon.isPercentage}
                      onCheckedChange={(checked) =>
                        setCurrentCoupon({
                          ...currentCoupon,
                          isPercentage: !!checked,
                        })
                      }
                    />
                    <label className="ml-2">Percentage Discount</label>
                  </div>
                  <Input
                    type="number"
                    placeholder="Max Uses (leave empty for unlimited)"
                    value={currentCoupon.maxUses || ""}
                    onChange={(e) =>
                      setCurrentCoupon({
                        ...currentCoupon,
                        maxUses: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                  <div className="col-span-2">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full">
                        <div className="flex flex-col">
                          <label className="mb-1 text-sm">Start Date</label>
                          <DatePicker
                            selected={currentCoupon.startDate}
                            onChange={(date: Date | null) =>
                              setCurrentCoupon({
                                ...currentCoupon,
                                startDate: date || new Date(),
                              })
                            }
                            className="w-full p-2 border rounded"
                            dateFormat="MM/dd/yyyy"
                          />
                        </div>
                      </div>
                      <div className="w-full">
                        <div className="flex flex-col">
                          <label className="mb-1 text-sm">
                            End Date (Optional)
                          </label>
                          <DatePicker
                            selected={currentCoupon.endDate}
                            onChange={(date: Date | null) =>
                              setCurrentCoupon({
                                ...currentCoupon,
                                endDate: date,
                              })
                            }
                            className="w-full p-2 border rounded"
                            dateFormat="MM/dd/yyyy"
                            isClearable
                            placeholderText="No end date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCouponForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addCoupon}>Add Coupon</Button>
                </div>
              </div>
            )}

            {!showCouponForm && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCouponForm(true)}
                className="mb-4"
              >
                Add New Coupon
              </Button>
            )}

            {/* Existing Coupons (for Update mode) */}
            {type === "Update" && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">Existing Coupons</h4>
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : existingCoupons.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {existingCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="flex justify-between items-center p-3 border rounded bg-gray-50"
                      >
                        <div>
                          <span className="font-medium">{coupon.code}</span> -
                          {coupon.isPercentage
                            ? ` ${coupon.discount}%`
                            : ` ₹${coupon.discount}`}
                          {coupon.maxUses !== null &&
                            ` (Max: ${coupon.maxUses})`}
                          <div className="text-xs text-gray-500 mt-1">
                            Uses: {coupon.currentUses || 0}
                            {coupon.maxUses !== null
                              ? `/${coupon.maxUses}`
                              : ""}
                            {coupon.isActive ? "" : " • Inactive"}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No coupons found for this event
                  </p>
                )}
              </div>
            )}

            {/* New coupons to be created */}
            {coupons.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-2">New Coupons</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {coupons.map((coupon, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border rounded bg-primary-50"
                    >
                      <div>
                        <span className="font-medium">{coupon.code}</span> -
                        {coupon.isPercentage
                          ? ` ${coupon.discount}%`
                          : ` ₹${coupon.discount}`}
                        {coupon.maxUses !== null && ` (Max: ${coupon.maxUses})`}
                        <div className="text-xs text-gray-500 mt-1">
                          Valid from: {coupon.startDate?.toLocaleDateString()}
                          {coupon.endDate
                            ? ` to ${coupon.endDate.toLocaleDateString()}`
                            : " (no end date)"}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCoupons(coupons.filter((_, i) => i !== index))
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {type === "Create" ? "Create Event" : "Update Event"}
          </Button>
        </form>
      </Form>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              coupon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCoupon}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventForm;
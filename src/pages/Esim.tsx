import React from "react";
import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";

export default function Esim() {
  return (
   <>
   <Header/>
     <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-extrabold">Go borderless with eSIMs</h1>
          <p className="mt-4 text-muted-foreground">Global adventures made easy — pay with multiple methods and stay connected while traveling.</p>

          <div className="mt-6">
            <input placeholder="What's your next destination?" className="w-full rounded-lg bg-muted/40 border border-border p-3" />
            <Button asChild className="mt-4 w-full">
              <Link to="/esim-categories">Browse eSIM Plans</Link>
            </Button>
          </div>
        </div>

        <div>
          <div className="h-60 w-full bg-gradient-to-br from-pink-500 to-yellow-400 rounded-lg"></div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-muted/20 rounded">
            <h3 className="font-semibold">Get started with eSIMs</h3>
            <p className="mt-2 text-sm text-muted-foreground">Make sure your phone is compatible. Once verified, look for your travel destination and purchase the data plan. <a className="underline">Check compatibility</a></p>
          </div>
          <div className="p-6 bg-muted/20 rounded">
            <h3 className="font-semibold">Pay with any payment method</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your payment is confirmed the same minute in most cases.</p>
          </div>
          <div className="p-6 bg-muted/20 rounded">
            <h3 className="font-semibold">Install the eSIM and activate your plan</h3>
            <p className="mt-2 text-sm text-muted-foreground">Scan the QR code or enter the activation details manually. Follow the prompts to install and activate your eSIM plan.</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-muted/20 rounded">
            <h3 className="font-semibold">Get started with eSIMs</h3>
            <p className="mt-2 text-sm text-muted-foreground">Make sure your phone is compatible. Once verified, look for your travel destination and purchase the data plan. <a className="underline">Check compatibility</a></p>
          </div>
          <div className="p-6 bg-muted/20 rounded">
            <h3 className="font-semibold">Pay with any payment method</h3>
            <p className="mt-2 text-sm text-muted-foreground">Your payment is confirmed the same minute in most cases.</p>
          </div>
          <div className="p-6 bg-muted/20 rounded">
            <h3 className="font-semibold">Install the eSIM and activate your plan</h3>
            <p className="mt-2 text-sm text-muted-foreground">Follow the installation instructions to activate your eSIM. <a className="underline">Installation Guide</a></p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Frequently asked questions</h2>
        <p className="mt-2 text-sm text-muted-foreground">Check out our Knowledge Base page for more FAQs</p>

        <div className="mt-6">
          <Accordion type="single" collapsible defaultValue="q1">
            <AccordionItem value="q1">
              <AccordionTrigger>What devices support eSIM?</AccordionTrigger>
              <AccordionContent>
                eSIMs are compatible with many devices but not all devices. To check if you can use eSIMs on your device, please have a look at our device compatibility list.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2">
              <AccordionTrigger>How do I use my eSIM?</AccordionTrigger>
              <AccordionContent>
                To install the eSIM, a stable internet connection is necessary. You can install your eSIM with QR Code or manually. Download our installation guide and consider setting it up before travel.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3">
              <AccordionTrigger>How many eSIMs can I have?</AccordionTrigger>
              <AccordionContent>
                Some devices allow multiple eSIMs. The number of active eSIMs depends on device model. You can keep your regular SIM while using an eSIM.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4">
              <AccordionTrigger>Does my eSIM come with a phone number?</AccordionTrigger>
              <AccordionContent>
                At this time, eSIMs are data-only plans and do not include phone numbers. You can continue using your personal number for apps requiring it.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q5">
              <AccordionTrigger>How long can I use an eSIM?</AccordionTrigger>
              <AccordionContent>
                eSIMs expire based on plan duration. Choose the plan that fits your needs; we'll remind you about expiration via email/text.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q6">
              <AccordionTrigger>How can I check my current data usage?</AccordionTrigger>
              <AccordionContent>
                You can check data usage on your order page. We'll also send updates about data usage via email/text.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q7">
              <AccordionTrigger>How do I share data or activate hotspot?</AccordionTrigger>
              <AccordionContent>
                You can share eSIM data by creating a personal hotspot on your device (iOS: Personal Hotspot; Android: Wi‑Fi hotspot settings).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
   </>
  );
}

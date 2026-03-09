"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CaptchaProvider } from "@/components/custom/CaptchaProvider";
import { cn } from "@/lib/utils";
import { GSTR1Content } from "./components/gstr1";
import { EInvoiceContent } from "./components/einvoice";

const tabs = [
    { id: "gstr1", label: "GSTR1" },
    { id: "einvoice", label: "E-Invoice" },
];

export const GstList = () => {
    const [activeTab, setActiveTab] = useState("gstr1");
    const x = 0;

    return (
        <CaptchaProvider>
            <div className="p-4 space-y-6 flex flex-col items-center">
                <div className="flex space-x-2 bg-muted p-1 rounded-lg">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.id}
                            variant={activeTab === tab.id ? "secondary" : "ghost"}
                            className={cn(
                                "px-4 py-2 text-sm font-medium transition-colors",
                                activeTab === tab.id && "bg-background shadow-sm"
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                <Card className="w-full max-w-4xl">
                    <CardContent className="p-6 flex justify-center">
                        {activeTab === "gstr1" && <GSTR1Content />}
                        {activeTab === "einvoice" && <EInvoiceContent />}
                    </CardContent>
                </Card>
            </div>
        </CaptchaProvider>
    )
}

import { useCompany } from "../../providers/company-provider";
import { useForm } from "@refinedev/react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { dataProvider } from "@/lib/dataprovider";
import { Spinner } from "@/components/ui/spinner";

export const CompanySettingsCard = () => {
    const { company } = useCompany();

    const form = useForm({
        refineCoreProps: {
            resource: "company",
            action: "edit",
            id: company?.id,
            queryOptions: {
                enabled: !!company?.id,
            },
        },
    });

    const {
        control,
        saveButtonProps,
    } = form;

    if (!company?.id) return null;

    return (
        <Card className="min-w-lg">
            <CardHeader>
                <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            saveButtonProps.onClick(e);
                        }}
                        className="space-y-6"
                    >
                        <FormField
                            control={control}
                            name="einvoice_enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm">
                                            E-Invoice Enabled
                                        </FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button
                            {...saveButtonProps}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>

                        <div className="pt-4 border-t">
                            <IkeaLoginButton />
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

const IkeaLoginButton = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const handleTriggerLogin = async () => {
        setIsLoading(true);
        setResponse(null);
        try {
            const { data } = await dataProvider.custom({
                url: "trigger_ikea_login",
                method: "get",
            });
            setResponse(data);
        } catch (error: any) {
            setResponse({ error: error.message || "Something went wrong" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsDialogOpen(true)}
            >
                <LogIn className="mr-2 h-4 w-4" />
                Trigger IKEA Login
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!isLoading) {
                    setIsDialogOpen(open);
                    if (!open) setResponse(null);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>IKEA Login Trigger</DialogTitle>
                        <DialogDescription>
                            {isLoading
                                ? "Triggering IKEA login... This may take up to 5 minutes."
                                : response
                                    ? "IKEA Login Response"
                                    : "Are you sure you want to trigger the IKEA login process? This action may take up to 5 minutes to complete."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 flex flex-col items-center justify-center min-h-[100px]">
                        {isLoading && (
                            <div className="flex flex-col items-center gap-4">
                                <Spinner className="h-8 w-8 text-primary" />
                                <span className="text-sm text-muted-foreground animate-pulse">Processing...</span>
                            </div>
                        )}

                        {!isLoading && response && (
                            <pre className="w-full bg-slate-950 p-4 rounded-md overflow-auto max-h-[300px] text-xs text-slate-50">
                                {JSON.stringify(response, null, 2)}
                            </pre>
                        )}
                    </div>

                    <DialogFooter>
                        {!isLoading && !response && (
                            <>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleTriggerLogin}>
                                    Confirm & Trigger
                                </Button>
                            </>
                        )}
                        {!isLoading && response && (
                            <Button onClick={() => setIsDialogOpen(false)}>
                                Close
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

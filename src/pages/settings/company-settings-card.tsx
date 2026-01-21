import { useCompany } from "../../providers/company-provider";
import { useForm } from "@refinedev/react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useEffect } from "react";

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
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

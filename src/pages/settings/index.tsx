import { useState, useEffect, useCallback } from "react";
import { useCompany } from "../../providers/company-provider";
import { useNotification } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { dataProvider } from "@/lib/dataprovider";
import { LoadingButton } from "@/components/ui/loading-button";
import { CompanySettingsCard } from "./company-settings-card";

type UserSession = {
    id: number;
    username: string;
    password?: string;
};

type UserSessionResponse = Record<string, UserSession>;

export const SettingsPage = () => {
    const { company } = useCompany();
    const { open } = useNotification();
    const [selectedKey, setSelectedKey] = useState<string>("");
    const [formData, setFormData] = useState<{ username: string; password: string }>({ username: "", password: "" });
    const [sessions, setSessions] = useState<UserSessionResponse>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchSessions = useCallback(async () => {
        if (!company?.id) return;
        let fetchedSessionData = {};
        setIsLoading(true);
        try {
            const { data } = await dataProvider.custom<UserSessionResponse>({
                url: "usersession",
                method: "get",
                query: {
                    company: company.id,
                },
            });
            fetchedSessionData = data;
            setSessions(data || {});
        } catch (error) {
            console.error("Error fetching sessions:", error);
            open?.({
                type: "error",
                message: "Error loading settings",
            });
        } finally {
            setSelectedKey((key) => key || (Object.keys(fetchedSessionData)[0] || ""));
            setIsLoading(false);
        }
    }, [company?.id, open]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    useEffect(() => {
        if (selectedKey && sessions[selectedKey]) {
            setFormData({
                username: sessions[selectedKey].username || "",
                password: sessions[selectedKey].password || "",
            });
        }
    }, [selectedKey, sessions]);

    const handleSave = async () => {
        if (!selectedKey || !company?.id) return;

        const session = sessions[selectedKey];
        if (!session) return;

        try {
            await dataProvider.custom({
                url: "usersession",
                method: "post",
                payload: {
                    id: session.id,
                    username: formData.username,
                    password: formData.password,
                },
            });

            open?.({
                type: "success",
                message: "Settings saved successfully",
            });

            await fetchSessions();
        } catch (error: any) {
            open?.({
                type: "error",
                message: "Error saving settings",
                description: error.message,
            });
        }
    };

    if (isLoading && Object.keys(sessions).length === 0) {
        // Only show full page loader if we have no data yet
        // Or maybe just show the card with loading state?
        // For now, let's keep it simple, but maybe better UX is to show the card structure.
    }

    const keys = Object.keys(sessions);

    return (
        <div className="p-4 gap-20 mx-auto flex">
            <Card className="min-w-md">
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Select value={selectedKey} onValueChange={setSelectedKey}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                                {keys.map((key) => (
                                    <SelectItem key={key} value={key}>
                                        {key}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedKey && (
                        <>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <LoadingButton onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </LoadingButton>
                        </>
                    )}
                </CardContent>
            </Card>

            <CompanySettingsCard />
        </div >
    );
};

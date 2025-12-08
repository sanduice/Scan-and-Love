import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function CleanupDuplicates() {
    const [cleaning, setCleaning] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [seedingBadges, setSeedingBadges] = useState(false);
    const [logs, setLogs] = useState([]);

    const handleCleanup = async () => {
        if (!confirm("This will permanently delete duplicate products and categories. Are you sure?")) return;
        
        setCleaning(true);
        setLogs(prev => [...prev, "Starting cleanup..."]);
        try {
            const res = await base44.functions.invoke('force_cleanup');
            const data = res.data;
            setLogs(prev => [...prev, ...data.log, `Deleted ${data.stats.deleted_products} products and ${data.stats.deleted_categories} categories.`]);
            toast.success("Cleanup complete!");
        } catch (error) {
            setLogs(prev => [...prev, `Error: ${error.message}`]);
            toast.error("Cleanup failed");
        } finally {
            setCleaning(false);
        }
    };

    const handleSeed = async () => {
        if (!confirm("This will scrape Signs.com and import products. This may take a few minutes. Continue?")) return;

        setSeeding(true);
        setLogs(prev => [...prev, "Starting seed from Signs.com..."]);
        try {
            const res = await base44.functions.invoke('seed_signs_catalog');
            const data = res.data;
            if (data.results) {
                setLogs(prev => [...prev, ...data.results]);
            }
            toast.success("Seeding complete!");
        } catch (error) {
            setLogs(prev => [...prev, `Error: ${error.message}`]);
            toast.error("Seeding failed");
        } finally {
            setSeeding(false);
        }
    };

    const handleSeedBadges = async () => {
        setSeedingBadges(true);
        setLogs(prev => [...prev, "Seeding Name Badge Products..."]);
        try {
            const res = await base44.functions.invoke('seed_name_badges');
            const data = res.data;
            setLogs(prev => [...prev, `Created/Updated ${data.count} badge products.`]);
            toast.success("Badges seeded!");
        } catch (error) {
            setLogs(prev => [...prev, `Error: ${error.message}`]);
            toast.error("Seeding badges failed");
        } finally {
            setSeedingBadges(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Maintenance</h1>
                        <p className="text-gray-600">Clean up duplicates and refresh catalog data</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                Cleanup Duplicates
                            </CardTitle>
                            <CardDescription>
                                Deletes duplicate products and categories based on URL slugs. 
                                Keeps the most populated/recent version.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                variant="destructive" 
                                onClick={handleCleanup} 
                                disabled={cleaning || seeding}
                                className="w-full"
                            >
                                {cleaning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Run Cleanup
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-blue-500" />
                                Rescan Signs.com
                            </CardTitle>
                            <CardDescription>
                                Scrapes target categories from Signs.com and imports them. 
                                Adds new products and updates existing ones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={handleSeed} 
                                disabled={cleaning || seeding}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Start Scraper & Import
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-amber-500" />
                                Seed Name Badges
                            </CardTitle>
                            <CardDescription>
                                Creates/Updates the 24 specific name badge variations (Standard, Premium, Executive) and categories.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={handleSeedBadges} 
                                disabled={seedingBadges}
                                className="w-full bg-amber-600 hover:bg-amber-700"
                            >
                                {seedingBadges ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Fix/Reset Badge Products
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-900">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                Force Catalog Organization
                            </CardTitle>
                            <CardDescription className="text-orange-700">
                                <strong>AGGRESSIVE:</strong> Deletes duplicates and strictly moves products to correct categories based on keywords. Fixes "A-Frames in Banners".
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                onClick={async () => {
                                    if(!confirm("This will PERMANENTLY delete duplicate products and move products around aggressively. Continue?")) return;
                                    setCleaning(true);
                                    setLogs(prev => [...prev, "Starting aggressive organization..."]);
                                    try {
                                        const res = await base44.functions.invoke('fix_catalog_organization', {});
                                        const data = res.data;
                                        setLogs(prev => [...prev, ...data.logs]);
                                        if(data.stats) {
                                            setLogs(prev => [...prev, `Deleted: ${data.stats.deleted} duplicates`, `Updated: ${data.stats.updated} products`]);
                                        }
                                        toast.success("Catalog organized!");
                                    } catch (e) {
                                        setLogs(prev => [...prev, `Error: ${e.message}`]);
                                        toast.error("Organization failed");
                                    } finally {
                                        setCleaning(false);
                                    }
                                }}
                                disabled={cleaning}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                            >
                                {cleaning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                                RUN DEEP CLEAN
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Operation Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-slate-950 text-green-400 p-4 rounded-lg font-mono text-xs h-96 overflow-y-auto">
                            {logs.length === 0 ? (
                                <span className="text-slate-600">// Waiting for command...</span>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                                        <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
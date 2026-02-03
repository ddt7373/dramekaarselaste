import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Share2, Sparkles, X, Maximize2 } from 'lucide-react';

interface Visualisation {
    id: string;
    svg: string;
    prompt: string;
    created_at: string;
}

interface VisualisationGalleryProps {
    visualisations: Visualisation[];
    onShare?: (vis: Visualisation) => void;
    onClose?: () => void;
}

const VisualisationGallery: React.FC<VisualisationGalleryProps> = ({
    visualisations,
    onShare,
    onClose
}) => {
    const [selectedVis, setSelectedVis] = useState<Visualisation | null>(null);

    const handleDownload = (vis: Visualisation) => {
        const blob = new Blob([vis.svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualisering-${vis.id}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPNG = async (vis: Visualisation) => {
        // Convert SVG to PNG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const svgBlob = new Blob([vis.svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = 800;
            canvas.height = 600;
            ctx?.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const pngUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = pngUrl;
                    a.download = `visualisering-${vis.id}.png`;
                    a.click();
                    URL.revokeObjectURL(pngUrl);
                }
            });

            URL.revokeObjectURL(url);
        };

        img.src = url;
    };

    if (visualisations.length === 0) {
        return (
            <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nog Geen Visualiserings
                </h3>
                <p className="text-sm text-gray-500">
                    Klik op "Skep Visualisering" by 'n AI antwoord om te begin
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visualisations.map((vis) => (
                    <Card key={vis.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div
                            className="w-full h-48 bg-gray-50 flex items-center justify-center cursor-pointer relative group"
                            onClick={() => setSelectedVis(vis)}
                        >
                            <div
                                className="w-full h-full p-2"
                                dangerouslySetInnerHTML={{ __html: vis.svg }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {vis.prompt}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(vis)}
                                    className="flex-1"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    SVG
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadPNG(vis)}
                                    className="flex-1"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    PNG
                                </Button>
                                {onShare && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onShare(vis)}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Full View Dialog */}
            {selectedVis && (
                <Dialog open={!!selectedVis} onOpenChange={() => setSelectedVis(null)}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Visualisering</DialogTitle>
                        </DialogHeader>
                        <div className="w-full bg-gray-50 rounded-lg p-4">
                            <div
                                className="w-full"
                                dangerouslySetInnerHTML={{ __html: selectedVis.svg }}
                            />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {selectedVis.prompt}
                        </p>
                        <div className="flex gap-2 mt-4">
                            <Button
                                onClick={() => handleDownload(selectedVis)}
                                variant="outline"
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Laai SVG Af
                            </Button>
                            <Button
                                onClick={() => handleDownloadPNG(selectedVis)}
                                variant="outline"
                                className="flex-1"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Laai PNG Af
                            </Button>
                            {onShare && (
                                <Button
                                    onClick={() => onShare(selectedVis)}
                                    className="flex-1"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Deel
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default VisualisationGallery;

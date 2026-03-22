import { useState, useRef } from "react";
import { Check, Upload, Loader2, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";

interface AvatarSelectorProps {
    currentAvatarUrl: string | null;
    onSelect: (url: string) => void;
}

// We use dicebear Notionists style for clean, simple avatars
const SEEDS = [
    "Felix", "Aneka", "Jasper", "Luna", "Oliver", "Cleo",
    "Milo", "Bella", "Leo", "Daisy", "Charlie", "Max",
    "Sam", "Lucy", "Oscar", "Zoe", "Buddy", "Ruby"
];

export function AvatarSelector({ currentAvatarUrl, onSelect }: AvatarSelectorProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getAvatarUrl = (seed: string) =>
        `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=transparent`;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        setIsProcessing(true);

        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 256; // Limit size to reduce DB payload
                        let width = img.width;
                        let height = img.height;

                        if (width > height && width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        } else if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }

                        // Use an offscreen canvas to resize
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                        }

                        // Compress to JPEG with 0.8 quality
                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                    img.onerror = () => reject(new Error('Failed to load image structure'));
                    img.src = event.target?.result as string;
                };
                reader.onerror = () => reject(new Error('Failed to read file on system'));
                reader.readAsDataURL(file);
            });

            onSelect(dataUrl);

        } catch (error) {
            console.error('Photo processing failed:', error);
            alert('Failed to process the photo. Please try a different smaller image.');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Determine if the current avatar is a custom upload (Starts with data:image)
    const isCustomUploaded = currentAvatarUrl?.startsWith('data:image/');

    return (
        <div className="space-y-4 flex flex-col items-start w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center shadow-inner">
                        {currentAvatarUrl ? (
                            <img src={currentAvatarUrl} alt="Current profile" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <h3 className="text-sm font-semibold">Profile Picture</h3>
                        <span className="text-xs text-muted-foreground">{isOpen ? "Close options" : "Click to select or upload an avatar"}</span>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>

            {isOpen && (
                <div className="p-4 rounded-xl border border-border bg-card/50 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200 w-full">
                    <div className="flex items-center justify-between w-full pb-3 border-b border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Custom</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileInputRef.current?.click(); }}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 shadow-sm"
                        >
                            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 shrink-0" />}
                            Upload Photo
                        </button>
                    </div>

                    {isCustomUploaded && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-accent/20 bg-accent/5 max-w-sm">
                            <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border-2 border-accent ring-2 ring-accent/30 ring-offset-1">
                                <img src={currentAvatarUrl} alt="Custom uploaded profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-accent flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Custom Photo Active</span>
                                <span className="text-[10px] text-muted-foreground">You are currently using an uploaded photo.</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-4">Or choose a preset character</span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 opacity-90 hover:opacity-100 transition-opacity">
                            {SEEDS.map((seed) => {
                                const url = getAvatarUrl(seed);
                                const isSelected = currentAvatarUrl === url;

                                return (
                                    <button
                                        key={seed}
                                        type="button"
                                        onClick={() => onSelect(url)}
                                        className={`relative aspect-square rounded-full border-2 overflow-hidden transition-all hover:scale-105 duration-200 ${isSelected
                                            ? "border-primary ring-2 ring-primary ring-offset-2 border-background shadow-md shadow-primary/20"
                                            : "border-transparent hover:border-primary/50 shadow-sm"
                                            }`}
                                    >
                                        <img
                                            src={url}
                                            alt={`Avatar option ${seed}`}
                                            className="w-full h-full object-cover bg-muted/20"
                                            loading="lazy"
                                        />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-in fade-in">
                                                <Check className="w-5 h-5 text-white stroke-[3] drop-shadow-md" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex justify-end">
                        Avatars by <a href="https://www.dicebear.com/" target="_blank" rel="noreferrer" className="underline ml-1 hover:text-primary transition-colors">DiceBear</a>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { ParkingLotWithStatus } from '@/types/parking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CongestionHeatmapProps {
  lots: ParkingLotWithStatus[];
  className?: string;
}

export function CongestionHeatmap({ lots, className }: CongestionHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const initMap = async (key: string) => {
    if (!mapRef.current || !key) return;

    try {
      setOptions({ key: key, v: 'weekly', libraries: ['visualization'] });
      
      await importLibrary('maps');
      await importLibrary('visualization');
      
      // Center on Delhi
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 28.6406, lng: 77.2200 },
        zoom: 13,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1a1a2e' }],
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#1a1a2e' }],
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#8892b0' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2d2d44' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0f0f1a' }],
          },
        ],
      });

      setMap(mapInstance);
      setIsLoaded(true);
      setError(null);
    } catch (err) {
      setError('Failed to load Google Maps. Please check your API key.');
      console.error('Google Maps error:', err);
    }
  };

  // Update markers when lots data changes
  useEffect(() => {
    if (!map || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create new markers for each lot
    lots.forEach(lot => {
      const utilization = lot.utilization;
      
      // Determine color based on utilization
      let color: string;
      let scale: number;
      
      if (utilization > 100) {
        color = '#ef4444'; // Red - over capacity
        scale = 1.5;
      } else if (utilization > 90) {
        color = '#f97316'; // Orange - near capacity
        scale = 1.3;
      } else if (utilization > 70) {
        color = '#eab308'; // Yellow - moderate
        scale = 1.1;
      } else {
        color = '#22c55e'; // Green - low utilization
        scale = 1;
      }

      const marker = new google.maps.Marker({
        position: { lat: lot.latitude, lng: lot.longitude },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 0.8,
          strokeColor: color,
          strokeWeight: 2,
          scale: 12 * scale,
        },
        title: `${lot.name}: ${utilization.toFixed(0)}%`,
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #1a1a2e; padding: 8px;">
            <strong>${lot.name}</strong><br/>
            <span>Utilization: ${utilization.toFixed(0)}%</span><br/>
            <span>Current: ${lot.currentCount}/${lot.allowedCapacity}</span><br/>
            <span style="color: ${lot.status === 'violating' ? '#ef4444' : '#22c55e'}">
              Status: ${lot.status === 'violating' ? 'Violating' : 'Compliant'}
            </span>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Create heatmap layer
    const heatmapData = lots.map(lot => ({
      location: new google.maps.LatLng(lot.latitude, lot.longitude),
      weight: Math.min(lot.utilization / 50, 3), // Weight based on utilization
    }));

    new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
      radius: 50,
      opacity: 0.6,
      gradient: [
        'rgba(34, 197, 94, 0)',
        'rgba(34, 197, 94, 0.5)',
        'rgba(234, 179, 8, 0.7)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 1)',
      ],
    });
  }, [map, lots, isLoaded]);

  const handleLoadMap = () => {
    if (apiKey.trim()) {
      initMap(apiKey.trim());
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Congestion Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isLoaded ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Google Maps API Key Required</p>
                <p>Enter your Google Maps API key to view the congestion heatmap. You can get one from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a>.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter Google Maps API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLoadMap} disabled={!apiKey.trim()}>
                Load Map
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        ) : (
          <div 
            ref={mapRef} 
            className="w-full h-[400px] rounded-lg overflow-hidden"
          />
        )}
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Low (&lt;70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Moderate (70-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">High (90-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Over Capacity (&gt;100%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

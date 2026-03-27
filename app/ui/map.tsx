"use client";

import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { BOUNDS, CENTER, MIN_ZOOM, DEFAULT_ZOOM } from "@/app/config/map";
import { MapReport, getPinIcon } from "@/app/lib/api";
import { useState } from "react";
import Image from "next/image";
import Sesizare from './sesizare';

interface MapComponentProps {
    onCenterChange?: (lat: number, lng: number) => void;
    reports?: MapReport[];
}

export default function MapComponent({ onCenterChange, reports = [] }: MapComponentProps) {
    const map = useMap("HARTA_SESIZARI_GALATI");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    return (
        <div className="w-full h-full">
            <Map
                id="HARTA_SESIZARI_GALATI"
                defaultZoom={DEFAULT_ZOOM}
                minZoom={MIN_ZOOM}
                defaultCenter={CENTER}
                mapId="HARTA_SESIZARI_GALATI"
                disableDefaultUI={true}
                onCameraChanged={(ev) => onCenterChange?.(ev.detail.center.lat, ev.detail.center.lng)}
                onClick={() => setSelectedId(null)}
                clickableIcons={false}
                gestureHandling={'greedy'}
            >
                {reports.map((report) => {
                    const isSelected = selectedId === report.id;
                    const pinSize = isSelected ? 50 : 30;
                    const pinIcon = getPinIcon(report.statusId);

                    return (
                        <AdvancedMarker
                            key={report.id}
                            position={{ lat: report.lat, lng: report.lng }}
                            zIndex={isSelected ? 10 : 1}
                            onClick={() => {
                                setSelectedId(isSelected ? null : report.id);
                                if (!isSelected) {
                                    map?.setCenter({ lat: report.lat, lng: report.lng });
                                    map?.setZoom(17);
                                }
                            }}
                        >
                            <div className="flex flex-col items-center">

                                {isSelected && (
                                    <Sesizare
                                        report={report}
                                        actionIcon="close"
                                        onActionClick={() => setSelectedId(null)}
                                    />
                                )}

                                <Image
                                    src={pinIcon}
                                    alt={report.statusName}
                                    width={pinSize}
                                    height={pinSize}
                                    style={{ transition: "width 0.2s, height 0.2s" }}
                                />
                            </div>
                        </AdvancedMarker>
                    );
                })}
            </Map>
        </div>
    );
}
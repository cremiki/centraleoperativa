import React from 'react';
import { Unit } from '../types';

interface FleetStatusSummaryProps {
    units: Unit[];
}

export const FleetStatusSummary: React.FC<FleetStatusSummaryProps> = ({ units }) => {
    const totalUnits = units.length;
    // Considera "attivi" tutti i veicoli con accensione inserita, indipendentemente dalla velocità.
    const activeUnits = units.filter(u => u.ignition).length;
    const stoppedUnits = totalUnits - activeUnits;

    return (
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg p-4 shadow-lg text-white w-56">
            <h3 className="text-lg font-bold mb-3 border-b border-gray-700 pb-2">Fleet Status</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total Vehicles:</span>
                    <span className="font-bold text-xl">{totalUnits}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        <span className="text-gray-300">Active:</span>
                    </div>
                    <span className="font-bold text-green-400">{activeUnits}</span>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                        <span className="text-gray-300">Stopped:</span>
                    </div>
                    <span className="font-bold text-red-400">{stoppedUnits}</span>
                </div>
            </div>
        </div>
    );
};

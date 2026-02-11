
import React, { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '../supabaseClient';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import TrailBadges from '../components/TrailBadges';
import { TrainingSection } from '../types';

interface LeaderboardCustomer {
  id: string;
  rank: number;
  firstName: string;
  lastName: string;
  dogName: string;
  avatarInitials: string;
  avatarColor: string;
  totalTrails: number;
}

const LeaderboardPage: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!supabase) {
        setError("Datenbankverbindung konnte nicht hergestellt werden.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, firstName, lastName, dogName, avatarInitials, avatarColor, trainingProgress');

      if (error) {
        console.error("Fehler beim Abrufen der Bestenliste:", error);
        setError("Fehler beim Laden der Daten.");
        setIsLoading(false);
        return;
      }

      if (data) {
        const processedData = data
          .map(c => {
            let trainingProgress: TrainingSection[] = [];
            if (typeof c.trainingProgress === 'string') {
              try {
                trainingProgress = JSON.parse(c.trainingProgress);
              } catch (e) {
                console.error("Fehler beim Parsen von trainingProgress für Kunde:", c.id, e);
              }
            } else {
                trainingProgress = c.trainingProgress;
            }

            const totalTrails = trainingProgress.reduce((sum, section) => sum + section.completedHours, 0);
            return {
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              dogName: c.dogName,
              avatarInitials: c.avatarInitials,
              avatarColor: c.avatarColor,
              totalTrails,
            };
          })
          .sort((a, b) => b.totalTrails - a.totalTrails)
          .map((customer, index) => ({
            ...customer,
            rank: index + 1,
          }));
        
        setLeaderboardData(processedData);
      }
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [supabase]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-700">Lade Bestenliste...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <img src="https://hs-bw.com/wp-content/uploads/2026/02/Trailer-Card-App-icon.png" alt="App Logo" className="h-20 w-20 mx-auto mb-2 rounded-xl" />
            <h1 className="text-4xl font-bold text-gray-900">Bestenliste der Trail-Helden</h1>
            <p className="text-lg text-gray-600 mt-2">Eine Rangliste der fleißigsten Mantrailing-Teams!</p>
        </div>

        <div className="space-y-4">
          {leaderboardData.map((customer) => (
            <Card key={customer.id} className="p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-center">
                <div className="text-4xl font-bold text-gray-400 w-12 text-center">
                  #{customer.rank}
                </div>
                
                <div className="flex items-center">
                  <Avatar initials={customer.avatarInitials} color={customer.avatarColor} size="lg" className="mr-4" />
                  <div>
                    <p className="font-bold text-lg text-gray-900">{customer.firstName} {customer.lastName}</p>
                    <p className="text-md text-gray-600">{customer.dogName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-5xl font-extrabold text-blue-600">{customer.totalTrails}</p>
                  <p className="text-sm font-medium text-gray-500">absolvierte Trails</p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                 <TrailBadges totalTrails={customer.totalTrails} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;

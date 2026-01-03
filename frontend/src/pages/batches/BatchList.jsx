import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Search, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const BatchList = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isTrainer, isAdmin } = useAuth();
  
  const canCreateBatch = isTrainer || isAdmin;

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches'); // Should support filtering by backend query params later
      setBatches(res.data.data);
    } catch (error) {
      console.error('Failed to fetch batches', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = batches.filter(batch => 
    batch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading batches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
           <p className="text-muted-foreground">Join upcoming live training sessions</p>
        </div>
        {canCreateBatch && (
          <Link to="/batches/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search batches..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.map((batch) => (
          <Link key={batch._id} to={`/batches/${batch._id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{batch.name}</CardTitle>
                    <span className={cn(
                        "px-2 py-1 text-xs rounded-full capitalize",
                        batch.status === 'upcoming' ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100" : 
                        batch.status === 'ongoing' ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100" :
                        "bg-gray-100 text-gray-700"
                    )}>
                        {batch.status}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {batch.course?.title || 'Unknown Course'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Starts: {new Date(batch.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{batch.currentEnrollment} / {batch.maxStudents} Students</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t mt-4">
                    <div>
                        <span className="text-xs text-muted-foreground">Price</span>
                        <div className="font-bold text-lg">₹{batch.batchPrice}</div>
                    </div>
                    <div>
                         <span className="text-xs text-muted-foreground">Trainer</span>
                         <div className="text-sm font-medium">{batch.trainer?.name}</div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredBatches.length === 0 && (
             <div className="col-span-full text-center py-12 border rounded-lg bg-card border-dashed">
                <p className="text-muted-foreground">No batches found matching your search.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default BatchList;

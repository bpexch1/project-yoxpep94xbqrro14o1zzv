import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Match } from "@/entities";
import { settleBets } from "@/functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettleMatch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settlementResult, setSettlementResult] = useState<any>(null);

  // Fetch active matches
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches-active"],
    queryFn: () => Match.query()
      .where("status", "in", ["live", "upcoming"])
      .sort("-match_time")
      .exec(),
  });

  const settleMutation = useMutation({
    mutationFn: (variables: { matchId: string; winningSide: string }) => 
      settleBets(variables),
    onSuccess: (data: any) => {
      if (data.success) {
        setSettlementResult(data);
        toast({
          title: "Settlement Successful",
          description: `Settled ${data.totalBetsSettled} bets for match.`,
        });
        queryClient.invalidateQueries({ queryKey: ["matches-active"] });
      } else {
        toast({
          variant: "destructive",
          title: "Settlement Failed",
          description: data.error || "An unknown error occurred.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Settlement Failed",
        description: error.message || "An error occurred during settlement.",
      });
    },
  });

  const handleOpenSettle = (match: any) => {
    setSelectedMatch(match);
    setSettlementResult(null);
    setIsModalOpen(true);
  };

  const handleConfirmSettle = (winningSide: string) => {
    if (!selectedMatch) return;
    settleMutation.mutate({
      matchId: selectedMatch.id,
      winningSide,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="py-6 px-[5px] max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[#2d323e] flex items-center gap-2">
          <Trophy className="w-8 h-8 text-brand-green" />
          Settle Match
        </h1>
        <p className="text-muted-foreground">
          Select a live or upcoming match to settle bets. Revenue split: 85% Admin | 15% Company.
        </p>
      </div>

      {!matches || matches.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No matches to settle</h3>
            <p className="text-muted-foreground">All matches are currently settled or none are available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match: any) => (
            <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={match.status === "live" ? "destructive" : "secondary"} className="capitalize">
                    {match.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(match.match_time).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg line-clamp-2">{match.title}</CardTitle>
                <CardDescription className="capitalize">{match.sport}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{match.team1}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {match.back_odds || "—"}
                      </Badge>
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                        {match.lay_odds || "—"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{match.team2}</span>
                    <div className="flex gap-2 justify-end">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {match.back_odds2 || "—"}
                      </Badge>
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                        {match.lay_odds2 || "—"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenSettle(match)}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white"
                >
                  Settle Match
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              Settling: {selectedMatch?.title}
            </DialogTitle>
            <DialogDescription>
              Choose the winning side to distribute P/L across all pending bets.
            </DialogDescription>
          </DialogHeader>

          {settlementResult ? (
            <div className="space-y-6 py-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold">Settlement Complete</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully processed {settlementResult.totalBetsSettled} bets for {settlementResult.winningSide}.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Stake</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Raw P/L</TableHead>
                      <TableHead>Admin (85%)</TableHead>
                      <TableHead>Company (15%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlementResult.settlements.map((s: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{s.username}</TableCell>
                        <TableCell>{s.stake}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "won" ? "default" : "destructive"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={s.pl_raw >= 0 ? "text-green-600" : "text-red-600"}>
                          {s.pl_raw >= 0 ? "+" : ""}{s.pl_raw.toFixed(2)}
                        </TableCell>
                        <TableCell className={s.pl_downline >= 0 ? "text-green-600" : "text-red-600"}>
                          {s.pl_downline >= 0 ? "+" : ""}{s.pl_downline.toFixed(2)}
                        </TableCell>
                        <TableCell className={s.pl_upline >= 0 ? "text-green-600" : "text-red-600"}>
                          {s.pl_upline >= 0 ? "+" : ""}{s.pl_upline.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{settlementResult.totalBetsSettled}</div>
                    <div className="text-xs text-muted-foreground">Total Bets</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className={cn(
                      "text-2xl font-bold",
                      settlementResult.settlements.reduce((acc: number, s: any) => acc + s.pl_downline, 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {settlementResult.settlements.reduce((acc: number, s: any) => acc + s.pl_downline, 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Admin Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className={cn(
                      "text-2xl font-bold",
                      settlementResult.settlements.reduce((acc: number, s: any) => acc + s.pl_upline, 0) >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {settlementResult.settlements.reduce((acc: number, s: any) => acc + s.pl_upline, 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Company Total</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Important: Settlement Formula</p>
                  <p>Settling will permanently update user balances and admin profit/loss based on the 85/15 revenue sharing rule. This action cannot be undone.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Select Winner:</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-2 hover:border-brand-green hover:bg-brand-green/5"
                    onClick={() => handleConfirmSettle(selectedMatch?.team1)}
                    disabled={settleMutation.isPending}
                  >
                    <span className="text-xs text-muted-foreground uppercase">Team 1</span>
                    <span className="text-lg font-bold">{selectedMatch?.team1}</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-2 hover:border-brand-green hover:bg-brand-green/5"
                    onClick={() => handleConfirmSettle(selectedMatch?.team2)}
                    disabled={settleMutation.isPending}
                  >
                    <span className="text-xs text-muted-foreground uppercase">Team 2</span>
                    <span className="text-lg font-bold">{selectedMatch?.team2}</span>
                  </Button>
                </div>
                <Button 
                  variant="ghost"
                  className="w-full h-12 border-2 hover:border-brand-green"
                  onClick={() => handleConfirmSettle("draw")}
                  disabled={settleMutation.isPending}
                >
                  Settle as Draw / Tie
                </Button>
              </div>

              {settleMutation.isPending && (
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
                  <p className="text-sm text-muted-foreground">Calculating P/L and updating records...</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              {settlementResult ? "Close" : "Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

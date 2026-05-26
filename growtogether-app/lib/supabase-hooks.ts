import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";

export function useInterests(familyId: string | undefined) {
  const [interests, setInterests] = useState<{ interest: string; rating: number }[]>([]);

  useEffect(() => {
    if (!familyId) return;
    supabase.from("interest_ratings").select("*").eq("family_id", familyId)
      .then(({ data }) => { if (data) setInterests(data); });
    const channel = supabase.channel(`interests-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "interest_ratings", filter: `family_id=eq.${familyId}` },
        () => { supabase.from("interest_ratings").select("*").eq("family_id", familyId).then(({ data }) => { if (data) setInterests(data); }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId]);

  async function saveInterests(ratings: { interest: string; rating: number }[]) {
    if (!familyId) return;
    await supabase.from("interest_ratings").delete().eq("family_id", familyId);
    await supabase.from("interest_ratings").insert(ratings.map((r) => ({ family_id: familyId, interest: r.interest, rating: r.rating })));
  }

  return { interests, saveInterests };
}

export function useJourney(familyId: string | undefined) {
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchJourney = useCallback(async () => {
    if (!familyId) return;
    const { data } = await supabase.from("journeys").select("*").eq("family_id", familyId).eq("status", "active").order("created_at", { ascending: false }).limit(1).single();
    setJourney(data ?? null);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    if (!familyId) return;
    fetchJourney();
    const channel = supabase.channel(`journey-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "journeys", filter: `family_id=eq.${familyId}` }, fetchJourney)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, fetchJourney]);

  async function createJourney(data: { goalTitle: string; goalDescription: string; targetCount: number; unit: string; linkedInterest: string; }) {
    if (!familyId) return;
    await supabase.from("journeys").insert({ family_id: familyId, goal_title: data.goalTitle, goal_description: data.goalDescription, target_count: data.targetCount, current_count: 0, unit: data.unit, linked_interest: data.linkedInterest, status: "active", approved_by_parent: false, parent_override: false });
  }

  async function approveJourney() {
    if (!journey) return;
    await supabase.from("journeys").update({ approved_by_parent: true }).eq("id", journey.id);
  }

  async function overrideJourney(data: { goalTitle: string; goalDescription: string; targetCount: number; unit: string; }) {
    if (!journey) return;
    await supabase.from("journeys").update({ goal_title: data.goalTitle, goal_description: data.goalDescription, target_count: data.targetCount, unit: data.unit, parent_override: true, approved_by_parent: true }).eq("id", journey.id);
  }

  return { journey, loading, createJourney, approveJourney, overrideJourney };
}

export function useCheckIns(familyId: string | undefined, journeyId: string | undefined) {
  const [checkIns, setCheckIns] = useState<any[]>([]);

  useEffect(() => {
    if (!familyId || !journeyId) return;
    supabase.from("check_ins").select("*").eq("family_id", familyId).eq("journey_id", journeyId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setCheckIns(data); });
    const channel = supabase.channel(`checkins-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "check_ins", filter: `family_id=eq.${familyId}` },
        () => { supabase.from("check_ins").select("*").eq("family_id", familyId).eq("journey_id", journeyId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setCheckIns(data); }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, journeyId]);

  async function saveCheckIn(data: { journeyId: string; progressAdded: number; reflectionQuestion: string; childAnswer: string; }) {
    if (!familyId) return;
    await supabase.from("check_ins").insert({ family_id: familyId, journey_id: data.journeyId, progress_added: data.progressAdded, reflection_question: data.reflectionQuestion, child_answer: data.childAnswer });
    await supabase.rpc("increment_journey_progress", { journey_id: data.journeyId, amount: data.progressAdded });
  }

  return { checkIns, saveCheckIn };
}

export function useParentSupport(familyId: string | undefined, journeyId: string | undefined) {
  const [parentSupport, setParentSupport] = useState<any[]>([]);

  useEffect(() => {
    if (!familyId || !journeyId) return;
    supabase.from("parent_support").select("*").eq("family_id", familyId).eq("journey_id", journeyId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setParentSupport(data); });
    const channel = supabase.channel(`parent-support-${familyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parent_support", filter: `family_id=eq.${familyId}` },
        () => { supabase.from("parent_support").select("*").eq("family_id", familyId).eq("journey_id", journeyId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setParentSupport(data); }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [familyId, journeyId]);

  async function saveParentSupport(data: { journeyId: string; summary: string; encouragementText: string; activitySuggestion: string; }) {
    if (!familyId) return;
    await supabase.from("parent_support").insert({ family_id: familyId, journey_id: data.journeyId, summary: data.summary, encouragement_text: data.encouragementText, activity_suggestion: data.activitySuggestion });
  }

  return { parentSupport, saveParentSupport };
}

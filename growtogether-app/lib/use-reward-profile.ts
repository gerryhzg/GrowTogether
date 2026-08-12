"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { useCheckIns, useInterests, useJourney, useParentSupport } from "@/lib/supabase-hooks";
import { calculateRewardProfile, getDailyChallenges, RewardProfile, ChallengeCard } from "@/lib/rewards";
import { DailyCheckIn, GrowthJourney, InterestName, ParentSupportEntry } from "@/lib/types";

const INTEREST_NAMES: InterestName[] = ["Music", "Sports", "Science", "Coding", "Art", "Animals"];

export function toInterestName(value: string): InterestName {
  return INTEREST_NAMES.includes(value as InterestName) ? (value as InterestName) : "Music";
}

export interface RewardData {
  profile: RewardProfile;
  challenges: ChallengeCard[];
  journey: GrowthJourney | null;
  checkIns: DailyCheckIn[];
  hasJourney: boolean;
}

/**
 * Single source of truth for reward numbers. The dashboard and the reward
 * room both read from here so they can never disagree about a child's level.
 */
export function useRewardProfile(): RewardData {
  const { user } = useAuth();
  const familyId = user?.familyId;

  const { journey } = useJourney(familyId);
  const { checkIns } = useCheckIns(familyId, journey?.id);
  const { parentSupport } = useParentSupport(familyId, journey?.id);
  const { interests } = useInterests(familyId);

  const mappedJourney = useMemo<GrowthJourney | null>(() => {
    if (!journey) return null;
    const linkedInterest = toInterestName(journey.linked_interest);
    return {
      id: journey.id,
      linkedInterest,
      topInterests: [linkedInterest],
      goalTitle: journey.goal_title,
      goalDescription: journey.goal_description,
      targetCount: journey.target_count,
      currentCount: journey.current_count,
      unit: journey.unit,
      status: journey.status as GrowthJourney["status"],
      createdAt: journey.created_at ?? "",
      updatedAt: journey.created_at ?? "",
    };
  }, [journey]);

  const mappedCheckIns = useMemo<DailyCheckIn[]>(
    () =>
      checkIns.map((entry) => ({
        id: entry.id,
        journeyId: entry.journey_id,
        date: entry.created_at ?? "",
        progressAdded: entry.progress_added,
        reflectionQuestion: entry.reflection_question,
        childAnswer: entry.child_answer,
      })),
    [checkIns]
  );

  const mappedSupport = useMemo<ParentSupportEntry[]>(
    () =>
      parentSupport.map((entry) => ({
        id: entry.id,
        journeyId: entry.journey_id,
        date: entry.created_at ?? "",
        summary: entry.summary,
        encouragementText: entry.encouragement_text,
        activitySuggestion: entry.activity_suggestion,
      })),
    [parentSupport]
  );

  const profile = useMemo(
    () => calculateRewardProfile(mappedJourney, mappedCheckIns, mappedSupport),
    [mappedJourney, mappedCheckIns, mappedSupport]
  );

  const topInterest = useMemo<InterestName | null>(() => {
    if (mappedJourney) {
      return mappedJourney.linkedInterest;
    }
    const ranked = [...interests].sort((left, right) => right.rating - left.rating);
    return ranked[0] ? toInterestName(ranked[0].interest) : null;
  }, [mappedJourney, interests]);

  const challenges = useMemo(() => getDailyChallenges(topInterest), [topInterest]);

  return {
    profile,
    challenges,
    journey: mappedJourney,
    checkIns: mappedCheckIns,
    hasJourney: Boolean(mappedJourney),
  };
}

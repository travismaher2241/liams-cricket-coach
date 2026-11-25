import type { Area } from "./drills";

export interface ProgrammeTemplate {
  key: string;
  title: string;
  area: Area | "iq";
  purpose: string;
  focusTags: string[];
  targetSessions: number;
  weeks: number;
  /** What Liam is told when the programme is complete. */
  revealArea: string;
}

export const PROGRAMME_TEMPLATES: ProgrammeTemplate[] = [
  { key: "batting-power", title: "Batting power", area: "batting", purpose: "Generate power through legs, hips and whole-body coordination rather than hands and wrists alone.", focusTags: ["power", "whole_body", "bat_speed", "rotation", "explosive"], targetSessions: 18, weeks: 6, revealArea: "your batting power and coordination" },
  { key: "batting-confidence", title: "Batting confidence", area: "batting", purpose: "Feel calm and in control at the crease, commit to shots, and reset after each ball.", focusTags: ["defence", "confidence", "routine", "head_position", "recovery"], targetSessions: 15, weeks: 6, revealArea: "your confidence at the crease" },
  { key: "shot-selection", title: "Shot selection", area: "batting", purpose: "Read length early and pick front or back foot with commitment.", focusTags: ["footwork", "reading_length", "decision_making", "back_foot", "front_foot"], targetSessions: 15, weeks: 5, revealArea: "reading the ball and choosing your shots" },
  { key: "bowling-accuracy", title: "Bowling accuracy", area: "bowling", purpose: "Land the ball on a consistent line and length.", focusTags: ["accuracy", "line_length", "consistency", "action", "run_up"], targetSessions: 15, weeks: 6, revealArea: "your bowling accuracy" },
  { key: "bowling-pace", title: "Bowling rhythm & pace", area: "bowling", purpose: "Smooth, repeatable run-up and action that lets pace build safely.", focusTags: ["run_up", "rhythm", "pace", "coordination", "explosive"], targetSessions: 15, weeks: 6, revealArea: "your bowling rhythm" },
  { key: "catching", title: "Catching consistency", area: "fielding", purpose: "Soft hands, early movement and confidence under high balls.", focusTags: ["catching", "hands", "reaction", "high_catch"], targetSessions: 15, weeks: 5, revealArea: "your catching" },
  { key: "throwing", title: "Throwing", area: "fielding", purpose: "Accurate, powerful throws with a side-on technique.", focusTags: ["throwing", "accuracy", "throwing_technique", "throwing_power"], targetSessions: 12, weeks: 5, revealArea: "your throwing" },
  { key: "athletic-coordination", title: "Athletic coordination", area: "athletic", purpose: "Balance, agility and body control for every part of cricket.", focusTags: ["balance", "agility", "coordination", "body_control", "footwork"], targetSessions: 15, weeks: 6, revealArea: "your balance and coordination" },
  { key: "speed", title: "Running speed", area: "athletic", purpose: "Acceleration and quick first steps for running and fielding.", focusTags: ["speed", "acceleration", "explosive", "running"], targetSessions: 12, weeks: 5, revealArea: "your speed off the mark" },
  { key: "match-confidence", title: "Match confidence", area: "mental", purpose: "Routines and resets that help in matches: one ball at a time.", focusTags: ["routine", "nerves", "recovery", "mistakes", "confidence", "self_belief"], targetSessions: 12, weeks: 6, revealArea: "your match-day confidence" },
];

export const TEMPLATE_BY_KEY = Object.fromEntries(PROGRAMME_TEMPLATES.map((t) => [t.key, t]));

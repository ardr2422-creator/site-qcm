"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/server/admin-auth";
import {
  closeLiveGame,
  createLiveGame,
  deleteLiveGame,
  reopenLiveGame,
} from "@/lib/server/live";
import { isUuid } from "@/lib/validation";

/** Actions de l'organisatrice sur les parties en direct. */

async function guard(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

function readId(formData: FormData): string {
  const id = formData.get("id");
  if (!isUuid(id)) throw new Error("Partie en direct introuvable.");
  return id;
}

export async function createLiveAction(formData: FormData): Promise<void> {
  await guard();
  const game = await createLiveGame(formData.get("name"));
  revalidatePath("/admin/direct");
  redirect(`/admin/direct/${game.id}`);
}

export async function closeLiveAction(formData: FormData): Promise<void> {
  await guard();
  const id = readId(formData);
  await closeLiveGame(id);
  revalidatePath("/admin/direct");
  revalidatePath(`/admin/direct/${id}`);
}

export async function reopenLiveAction(formData: FormData): Promise<void> {
  await guard();
  const id = readId(formData);
  await reopenLiveGame(id);
  revalidatePath("/admin/direct");
  revalidatePath(`/admin/direct/${id}`);
}

export async function deleteLiveAction(formData: FormData): Promise<void> {
  await guard();
  await deleteLiveGame(readId(formData));
  revalidatePath("/admin/direct");
  redirect("/admin/direct");
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const submitSchema = z.object({
  questionId: z.string(),
  selectedAnswer: z.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const question = await prisma.mCQQuestion.findUnique({
      where: { id: validation.data.questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = validation.data.selectedAnswer === question.correctAnswer;

    const submission = await prisma.mCQSubmission.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: validation.data.questionId,
        },
      },
      update: { selectedAnswer: validation.data.selectedAnswer, isCorrect },
      create: {
        userId: session.user.id,
        questionId: validation.data.questionId,
        selectedAnswer: validation.data.selectedAnswer,
        isCorrect,
      },
    });

    return NextResponse.json({
      data: {
        ...submission,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      },
    });
  } catch (error) {
    console.error("Submit MCQ error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  icon?: React.ElementType;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export function StepIndicator({ steps, currentStep, completedSteps, className }: StepIndicatorProps) {
  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId: string) => stepId === currentStep;

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const completed = isStepCompleted(step.id);
          const current = isStepCurrent(step.id);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {/* Indicateur d'étape */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    completed
                      ? "bg-success border-success text-success-foreground"
                      : current
                      ? "bg-primary border-primary text-primary-foreground animate-pulse"
                      : "bg-background border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {completed ? (
                    <Check className="h-5 w-5" />
                  ) : Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Titre de l'étape */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      completed || current
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Ligne de connexion */}
              {!isLast && (
                <div className="flex-1 mx-4 mt-[-20px]">
                  <div
                    className={cn(
                      "h-0.5 transition-all duration-300",
                      completed || (current && index < getCurrentStepIndex())
                        ? "bg-success"
                        : "bg-muted-foreground/30"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
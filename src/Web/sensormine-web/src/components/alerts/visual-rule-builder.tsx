"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export interface AlertCondition {
  field: string;
  operator: 'GreaterThan' | 'LessThan' | 'Equal' | 'NotEqual' | 'Between' | 'Outside';
  value: number;
  secondValue?: number;
}

interface VisualRuleBuilderProps {
  conditions: AlertCondition[];
  conditionLogic: 'AND' | 'OR';
  onConditionsChange: (conditions: AlertCondition[]) => void;
  onLogicChange: (logic: 'AND' | 'OR') => void;
  availableFields?: Array<{ name: string; friendlyName: string; unit?: string }>;
}

const operatorLabels: Record<AlertCondition['operator'], string> = {
  GreaterThan: 'Greater than (>)',
  LessThan: 'Less than (<)',
  Equal: 'Equal to (=)',
  NotEqual: 'Not equal to (≠)',
  Between: 'Between',
  Outside: 'Outside range'
};

export function VisualRuleBuilder({
  conditions,
  conditionLogic,
  onConditionsChange,
  onLogicChange,
  availableFields = []
}: VisualRuleBuilderProps) {
  const [localConditions, setLocalConditions] = useState<AlertCondition[]>(conditions);

  useEffect(() => {
    setLocalConditions(conditions);
  }, [conditions]);

  const addCondition = () => {
    const newCondition: AlertCondition = {
      field: availableFields[0]?.name || 'temperature',
      operator: 'GreaterThan',
      value: 0
    };
    const updated = [...localConditions, newCondition];
    setLocalConditions(updated);
    onConditionsChange(updated);
  };

  const removeCondition = (index: number) => {
    const updated = localConditions.filter((_, i) => i !== index);
    setLocalConditions(updated);
    onConditionsChange(updated);
  };

  const updateCondition = (index: number, updates: Partial<AlertCondition>) => {
    const updated = localConditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    );
    setLocalConditions(updated);
    onConditionsChange(updated);
  };

  const needsSecondValue = (operator: AlertCondition['operator']) => {
    return operator === 'Between' || operator === 'Outside';
  };

  const getFieldUnit = (fieldName: string) => {
    const field = availableFields.find(f => f.name === fieldName);
    return field?.unit ? ` (${field.unit})` : '';
  };

  return (
    <div className="space-y-4">
      {/* Logic Selector */}
      {localConditions.length > 1 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">If</Label>
          <Select
            value={conditionLogic}
            onValueChange={(value: 'AND' | 'OR') => onLogicChange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">ALL conditions match</SelectItem>
              <SelectItem value="OR">ANY condition matches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Conditions */}
      <div className="space-y-3">
        {localConditions.map((condition, index) => (
          <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="flex items-center text-gray-400 cursor-grab active:cursor-grabbing mt-2">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Condition Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Field Selector */}
                  <div className="md:col-span-4">
                    <Label className="text-xs text-gray-600 mb-1">Field</Label>
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, { field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map((field) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.friendlyName}
                            {field.unit && <span className="text-xs text-gray-500"> ({field.unit})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator Selector */}
                  <div className="md:col-span-3">
                    <Label className="text-xs text-gray-600 mb-1">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value: AlertCondition['operator']) => 
                        updateCondition(index, { operator: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(operatorLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Input(s) */}
                  {needsSecondValue(condition.operator) ? (
                    <>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-600 mb-1">Min{getFieldUnit(condition.field)}</Label>
                        <Input
                          type="number"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) })}
                          placeholder="Min"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-xs text-gray-600 mb-1">Max{getFieldUnit(condition.field)}</Label>
                        <Input
                          type="number"
                          value={condition.secondValue || 0}
                          onChange={(e) => updateCondition(index, { secondValue: parseFloat(e.target.value) })}
                          placeholder="Max"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-4">
                      <Label className="text-xs text-gray-600 mb-1">Value{getFieldUnit(condition.field)}</Label>
                      <Input
                        type="number"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) })}
                        placeholder="Threshold value"
                      />
                    </div>
                  )}

                  {/* Remove Button */}
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Human-Readable Summary */}
              <div className="mt-2 ml-8 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <span className="font-medium">When </span>
                <span className="text-blue-600">{availableFields.find(f => f.name === condition.field)?.friendlyName || condition.field}</span>
                <span className="text-gray-500"> {operatorLabels[condition.operator].toLowerCase()} </span>
                {needsSecondValue(condition.operator) ? (
                  <>
                    <span className="font-semibold">{condition.value}</span>
                    <span className="text-gray-500"> and </span>
                    <span className="font-semibold">{condition.secondValue || 0}</span>
                  </>
                ) : (
                  <span className="font-semibold">{condition.value}</span>
                )}
                {getFieldUnit(condition.field)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Condition Button */}
      <Button
        variant="outline"
        onClick={addCondition}
        className="w-full border-dashed border-2 hover:border-blue-400 hover:bg-blue-50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>

      {/* Preview Summary */}
      {localConditions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Alert will trigger when:</p>
          <div className="text-sm text-blue-800 space-y-1">
            {localConditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="font-bold text-blue-600 uppercase text-xs">{conditionLogic}</span>
                )}
                <span>
                  <span className="font-medium">{availableFields.find(f => f.name === cond.field)?.friendlyName || cond.field}</span>
                  {' '}{operatorLabels[cond.operator].toLowerCase()}{' '}
                  <span className="font-semibold">{cond.value}</span>
                  {needsSecondValue(cond.operator) && (
                    <> and <span className="font-semibold">{cond.secondValue}</span></>
                  )}
                  {getFieldUnit(cond.field)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

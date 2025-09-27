
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, query, getDocs, where, serverTimestamp, doc } from 'firebase/firestore';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const SmartItemLog = ({ currentDate }: { currentDate: Date }) => {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const currentUserRef = useMemoFirebase(() => currentUser ? doc(firestore, "users", currentUser.uid) : null, [firestore, currentUser]);
  const { data: currentUserData } = useDoc(currentUserRef);
  
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previousItems, setPreviousItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPreviousItems = async () => {
      if (!currentUserData?.groupId) return;
      
      try {
        const itemsQuery = query(
          collection(firestore, 'groups', currentUserData.groupId, 'purchasedItems')
        );
        const snapshot = await getDocs(itemsQuery);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Item[];
        setPreviousItems(items);
      } catch (error) {
        console.error('Error loading previous items:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load previous items.' });
      }
    };

    loadPreviousItems();
  }, [currentUserData?.groupId, firestore, toast]);

  const filteredSuggestions = useMemo(() => {
    if (!itemName.trim() || itemName.length < 2) return [];
    
    const uniqueNames = [...new Set(previousItems.map(item => item.name))];
    return uniqueNames.filter(name => 
      name.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 5);
  }, [itemName, previousItems]);

  const handleItemNameChange = (value: string) => {
    setItemName(value);
    setShowSuggestions(value.length >= 2);
  };

  const selectSuggestion = (suggestion: string) => {
    setItemName(suggestion);
    setShowSuggestions(false);
    
    const lastUsedItem = previousItems
      .filter(item => item.name === suggestion)
      .sort((a, b) => (b.date as any) - (a.date as any))[0];
    
    if (lastUsedItem && lastUsedItem.cost) {
      setCost((lastUsedItem.cost / lastUsedItem.quantity).toString());
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please log in to save items.' });
        return;
      }

      if (!currentUserData?.groupId) {
        toast({ variant: 'destructive', title: 'Error', description: 'You need to join a group first.' });
        return;
      }

      if (!itemName.trim()) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter an item name.' });
        return;
      }

      const itemQuantity = parseInt(quantity) || 1;
      const itemCost = parseFloat(cost) || 0;

      const itemToSave = {
        name: itemName.trim(),
        quantity: itemQuantity,
        unit: 'unit', // Adding a default unit
        cost: itemCost * itemQuantity,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        groupId: currentUserData.groupId,
        date: currentDate,
      };

      await addDoc(
        collection(firestore, 'groups', currentUserData.groupId, 'purchasedItems'), 
        itemToSave
      );

      toast({ title: 'Success', description: `Item "${itemName}" saved successfully!` });
      
      setItemName('');
      setQuantity('1');
      setCost('');
      setShowSuggestions(false);

    } catch (error) {
      console.error('Error saving item:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save item. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  };

  const getItemInvestment = (itemName: string) => {
    const itemPurchases = previousItems.filter(item => 
      item.name.toLowerCase() === itemName.toLowerCase()
    );
    
    const totalQuantity = itemPurchases.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalCost = itemPurchases.reduce((sum, item) => sum + (item.cost || 0), 0);
    
    return { totalQuantity, totalCost, purchaseCount: itemPurchases.length };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Shopping Log</CardTitle>
        <CardDescription>Log items with auto-suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="relative space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              type="text"
              value={itemName}
              onChange={(e) => handleItemNameChange(e.target.value)}
              placeholder="e.g., Rice, Milk..."
              autoComplete="off"
              required
            />
            
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => {
                  const investment = getItemInvestment(suggestion);
                  return (
                    <div
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      className="px-3 py-2 hover:bg-accent cursor-pointer border-b"
                    >
                      <p className="font-medium">{suggestion}</p>
                      <p className="text-xs text-muted-foreground">
                        Used {investment.purchaseCount} times • Total Cost: ৳{investment.totalCost.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per unit</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {cost && quantity && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Cost:</p>
              <p className="text-lg font-bold">
                ৳{((parseFloat(cost) || 0) * (parseInt(quantity) || 1)).toFixed(2)}
              </p>
            </div>
          )}

          {itemName && previousItems.some(item => 
            item.name.toLowerCase() === itemName.toLowerCase()
          ) && (
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">Previous Investment:</p>
              {(() => {
                const investment = getItemInvestment(itemName);
                return (
                  <div className="text-sm text-primary/80">
                    Total bought: {investment.totalQuantity} units<br/>
                    Total spent: ৳{investment.totalCost.toFixed(2)}
                  </div>
                );
              })()}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

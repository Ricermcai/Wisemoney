
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Rocket, PartyPopper, Plus, History, Save, Lock, Target, Minus, CheckCircle, Trash2, AlertCircle, Sun, ChevronUp, ChevronDown } from 'lucide-react';
import { FundType, LedgerState, Transaction, DreamGoal } from '../types';
import { StorageService } from '../services/storage';

interface LedgerInterfaceProps {
  onClose: () => void;
}

const INITIAL_STATE: LedgerState = {
  freedomFund: 0,
  dreamFund: 0,
  playFund: 0,
  transactions: [],
  dreamGoals: [],
  percentages: {
    freedom: 50,
    dream: 40,
    play: 10
  }
};

type ModalType = 'NONE' | 'ADD_GOAL' | 'REALIZE_DREAM' | 'SPEND_PLAY' | 'CONFIRM_COMBINED_SPEND' | 'INSUFFICIENT_FUNDS';

export const LedgerInterface: React.FC<LedgerInterfaceProps> = ({ onClose }) => {
  const [state, setState] = useState<LedgerState>(INITIAL_STATE);
  const [incomeInput, setIncomeInput] = useState<string>('');
  
  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  const [modalInputAmount, setModalInputAmount] = useState('');
  const [modalInputText, setModalInputText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  // Allocation inputs (numbers)
  const [allocations, setAllocations] = useState({
    freedom: 0,
    dream: 0,
    play: 0
  });

  // Load from unified storage
  useEffect(() => {
    const db = StorageService.getDB();
    if (db.ledger) {
         // Deep merge or sanitation check to ensure percentages/arrays exist
         const loaded = db.ledger;
         if (!loaded.percentages) loaded.percentages = INITIAL_STATE.percentages;
         if (!loaded.dreamGoals) loaded.dreamGoals = [];
         if (!loaded.transactions) loaded.transactions = [];
         
         // Ensure types are correct (fix legacy string numbers if any)
         loaded.transactions = loaded.transactions.map((t: any) => ({
            ...t,
            type: t.type || 'DEPOSIT', 
            fundType: t.fundType ? t.fundType.toUpperCase() : 'FREEDOM',
            amount: Number(t.amount) || 0
        }));
        loaded.freedomFund = Number(loaded.freedomFund) || 0;
        loaded.dreamFund = Number(loaded.dreamFund) || 0;
        loaded.playFund = Number(loaded.playFund) || 0;

        setState(loaded);
    }
  }, []);

  // Save to unified storage
  useEffect(() => {
    // Only save if we have initialized state (simple check to avoid overwriting with initial empty state on first render race conditions, though useEffect dependencies usually handle this)
    if (state !== INITIAL_STATE) {
        StorageService.saveLedger(state);
    }
  }, [state]);

  // --- Logic Helpers ---

  const getValidIncome = () => {
      const val = parseFloat(incomeInput);
      return (!isNaN(val) && val > 0) ? val : 0;
  };

  const recalculateAmountsFromPercentages = (totalAmount: number, currentPercentages: LedgerState['percentages']) => {
    if (totalAmount <= 0) {
        setAllocations({ freedom: 0, dream: 0, play: 0 });
        return;
    }
    const freedom = Math.round(totalAmount * (currentPercentages.freedom / 100));
    const dream = Math.round(totalAmount * (currentPercentages.dream / 100));
    // Use subtraction to ensure exact sum matches total
    const play = parseFloat((totalAmount - freedom - dream).toFixed(2));
    setAllocations({ freedom, dream, play });
  };

  const handleIncomeChange = (val: string) => {
    setIncomeInput(val);
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0) {
        recalculateAmountsFromPercentages(amount, state.percentages);
    } else {
        setAllocations({ freedom: 0, dream: 0, play: 0 });
    }
  };

  // Smart Percentage Adjustment (Waterbed Effect)
  const adjustPercentage = (target: keyof LedgerState['percentages'], delta: number) => {
    const newP = { ...state.percentages };
    
    // 1. Calculate ideal new value for target
    let newValue = newP[target] + delta;
    if (newValue < 0) newValue = 0;
    if (newValue > 100) newValue = 100;
    
    // If no change possible, stop
    if (newValue === newP[target]) return;

    const actualDelta = newValue - newP[target];
    newP[target] = newValue;

    // 2. Distribute the opposite change (-actualDelta) to other fields
    // Priority order for absorbing changes: Play -> Dream -> Freedom
    // This implies: "Luxury" (Play) is the first buffer, then "Goals" (Dream), then "Security" (Freedom).
    const priorityOrder: (keyof LedgerState['percentages'])[] = ['play', 'dream', 'freedom'];
    const others = priorityOrder.filter(k => k !== target);

    let remainingToDistribute = -actualDelta;

    for (const key of others) {
        if (remainingToDistribute === 0) break;
        
        let val = newP[key];
        const originalVal = val;
        
        val += remainingToDistribute;

        // Clamp
        if (val < 0) {
            remainingToDistribute = val; // Negative overflow, still need to subtract more from next
            val = 0;
        } else if (val > 100) {
            remainingToDistribute = val - 100; // Positive overflow, still need to add more to next
            val = 100;
        } else {
            remainingToDistribute = 0; // Fully absorbed
        }
        newP[key] = val;
    }

    // Safety check: if loop finished but sum != 100 due to edge cases, force fix the target
    if (remainingToDistribute !== 0) {
        newP[target] += remainingToDistribute;
    }

    setState(prev => ({ ...prev, percentages: newP }));
    
    // Update amounts immediately if income is present
    const income = getValidIncome();
    if (income > 0) {
        recalculateAmountsFromPercentages(income, newP);
    }
  };

  const handleManualAmountChange = (type: keyof typeof allocations, val: string) => {
      const numVal = parseFloat(val);
      // Allow user to clear input (NaN), treat as 0 for state but keep input fluid
      setAllocations(prev => ({
          ...prev,
          [type]: isNaN(numVal) ? 0 : numVal
      }));
  };

  // --- Validation ---
  const incomeVal = getValidIncome();
  const sumAllocations = allocations.freedom + allocations.dream + allocations.play;
  const diff = Math.abs(incomeVal - sumAllocations);
  // Valid if income exists (>0) AND sum matches income (tolerance 0.01)
  const isValidAllocation = incomeVal > 0 && diff < 0.01;
  const showValidationError = incomeVal > 0 && !isValidAllocation;

  // --- Actions ---

  const executeAllocation = () => {
    if (!isValidAllocation) return;

    const newTransactions: Transaction[] = [];
    const timestamp = Date.now();
    const idBase = timestamp.toString();

    const allocFreedom = Number(allocations.freedom) || 0;
    const allocDream = Number(allocations.dream) || 0;
    const allocPlay = Number(allocations.play) || 0;

    if (allocFreedom > 0) newTransactions.push({ id: idBase + '-1', amount: allocFreedom, fundType: 'FREEDOM', type: 'DEPOSIT', description: '收入分配', date: timestamp });
    if (allocDream > 0) newTransactions.push({ id: idBase + '-2', amount: allocDream, fundType: 'DREAM', type: 'DEPOSIT', description: '收入分配', date: timestamp });
    if (allocPlay > 0) newTransactions.push({ id: idBase + '-3', amount: allocPlay, fundType: 'PLAY', type: 'DEPOSIT', description: '收入分配', date: timestamp });

    setState(prev => ({
      ...prev,
      freedomFund: prev.freedomFund + allocFreedom,
      dreamFund: prev.dreamFund + allocDream,
      playFund: prev.playFund + allocPlay,
      transactions: [...newTransactions, ...prev.transactions]
    }));

    setIncomeInput('');
    setAllocations({ freedom: 0, dream: 0, play: 0 });
  };

  const deleteTransaction = (id: string) => {
    // 1. Find Transaction
    const t = state.transactions.find(item => item.id === id);
    if (!t) return;

    // 2. Simple Confirmation
    const actionType = t.type === 'DEPOSIT' ? '扣除' : '退回';
    if (!confirm(`确定要删除这条"${t.description}"记录吗？\n金额: ¥${t.amount.toLocaleString()}\n资金将自动${actionType}。`)) {
        return;
    }

    // 3. Execute Deletion
    setState(prev => {
        let newState = { ...prev };
        const amount = Number(t.amount);

        // Reverse the effect of the transaction
        if (t.type === 'DEPOSIT') {
            if (t.fundType === 'FREEDOM') newState.freedomFund = Math.max(0, newState.freedomFund - amount);
            if (t.fundType === 'DREAM') newState.dreamFund = Math.max(0, newState.dreamFund - amount);
            if (t.fundType === 'PLAY') newState.playFund = Math.max(0, newState.playFund - amount);
        } else {
            if (t.fundType === 'FREEDOM') newState.freedomFund += amount;
            if (t.fundType === 'DREAM') newState.dreamFund += amount;
            if (t.fundType === 'PLAY') newState.playFund += amount;
        }

        // Special: if this was a "Realize Dream" transaction, reset the goal status
        if (t.description.startsWith('实现梦想: ')) {
             const goalName = t.description.replace('实现梦想: ', '');
             const goal = newState.dreamGoals.find(g => g.name === goalName && g.isAchieved);
             if (goal) {
                 newState.dreamGoals = newState.dreamGoals.map(g => 
                    g.id === goal.id ? { ...g, isAchieved: false, achievedDate: undefined } : g
                 );
             }
        }

        return {
            ...newState,
            transactions: prev.transactions.filter(item => item.id !== id)
        };
    });
  };

  // ... (Other handlers unchanged: handleAddGoal, handleSpendPlay, executeDreamRealization, checkDreamFunds, handleCombinedRealization, deleteGoal, closeModal)
  const handleAddGoal = () => {
    if (!modalInputText || !modalInputAmount) return;
    const newGoal: DreamGoal = {
      id: Date.now().toString(),
      name: modalInputText,
      cost: parseFloat(modalInputAmount),
      isAchieved: false
    };
    setState(prev => ({ ...prev, dreamGoals: [...prev.dreamGoals, newGoal] }));
    closeModal();
  };

  const handleSpendPlay = () => {
    const amount = parseFloat(modalInputAmount);
    if (!amount || amount > state.playFund) return;
    const transaction: Transaction = {
      id: Date.now().toString(),
      amount: amount,
      fundType: 'PLAY',
      type: 'WITHDRAWAL',
      description: modalInputText || '乐享支出',
      date: Date.now()
    };
    setState(prev => ({
      ...prev,
      playFund: prev.playFund - amount,
      transactions: [transaction, ...prev.transactions]
    }));
    closeModal();
  };

  const executeDreamRealization = (goalId: string, dreamAmount: number, playAmount: number) => {
    const goal = state.dreamGoals.find(g => g.id === goalId);
    if (!goal) return;
    const newTransactions: Transaction[] = [];
    const timestamp = Date.now();
    if (dreamAmount > 0) {
      newTransactions.push({ id: timestamp + '-D', amount: dreamAmount, fundType: 'DREAM', type: 'WITHDRAWAL', description: `实现梦想: ${goal.name}`, date: timestamp });
    }
    if (playAmount > 0) {
       newTransactions.push({ id: timestamp + '-P', amount: playAmount, fundType: 'PLAY', type: 'WITHDRAWAL', description: `支持梦想: ${goal.name} (余额补足)`, date: timestamp });
    }
    setState(prev => ({
      ...prev,
      dreamFund: prev.dreamFund - dreamAmount,
      playFund: prev.playFund - playAmount,
      dreamGoals: prev.dreamGoals.map(g => g.id === goal.id ? { ...g, isAchieved: true, achievedDate: timestamp } : g),
      transactions: [...newTransactions, ...prev.transactions]
    }));
    closeModal();
  };

  const checkDreamFunds = () => {
    const goal = state.dreamGoals.find(g => g.id === selectedGoalId);
    if (!goal) return;
    if (state.dreamFund >= goal.cost) {
      executeDreamRealization(goal.id, goal.cost, 0);
      return;
    }
    if (state.dreamFund + state.playFund >= goal.cost) {
      setActiveModal('CONFIRM_COMBINED_SPEND');
      return;
    }
    setActiveModal('INSUFFICIENT_FUNDS');
  };

  const handleCombinedRealization = () => {
     const goal = state.dreamGoals.find(g => g.id === selectedGoalId);
     if (!goal) return;
     const dreamAmount = state.dreamFund; 
     const playAmount = goal.cost - state.dreamFund;
     executeDreamRealization(goal.id, dreamAmount, playAmount);
  };

  const deleteGoal = (id: string) => {
    if(confirm("确定要删除这个梦想目标吗？")) {
      setState(prev => ({ ...prev, dreamGoals: prev.dreamGoals.filter(g => g.id !== id) }));
    }
  };

  const closeModal = () => {
    setActiveModal('NONE');
    setModalInputAmount('');
    setModalInputText('');
    setSelectedGoalId('');
  };

  const totalBalance = state.freedomFund + state.dreamFund + state.playFund;
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  return (
    <div className="fixed inset-0 bg-amber-50 z-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900">我的财富账本</h2>
            <p className="text-amber-600">分配你的金鹅，养肥你的梦想</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white hover:bg-amber-100 rounded-full shadow-sm transition-colors border border-amber-200">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Total Wealth Summary */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg mb-8 flex items-center justify-between">
          <div>
            <p className="text-amber-100 font-medium mb-1">总资产 (Total Wealth)</p>
            <h3 className="text-4xl font-bold">¥ {totalBalance.toLocaleString()}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Fund Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Freedom Fund (LOCKED) */}
          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-yellow-500 flex flex-col h-full relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 bg-gray-100 p-8 rounded-full opacity-20 group-hover:opacity-40 transition-opacity">
                <Lock className="w-16 h-16 text-gray-500" />
             </div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-bold text-gray-800">财务自由基金</h4>
            </div>
            <p className="text-sm text-gray-500 mb-2">养金鹅 ({state.percentages.freedom}%)</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">¥ {state.freedomFund.toLocaleString()}</p>
            <div className="mt-auto pt-4 border-t border-gray-100">
                <p className="text-xs text-red-400 flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    金鹅不可杀 (不可支出)
                </p>
            </div>
          </div>

          {/* Dream Fund */}
          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-purple-500 flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-bold text-gray-800">梦想基金</h4>
            </div>
            <p className="text-sm text-gray-500 mb-2">为目标储蓄 ({state.percentages.dream}%)</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">¥ {state.dreamFund.toLocaleString()}</p>
            
            {/* Dream Goals Mini List */}
            <div className="space-y-2 mb-4 flex-grow">
               {state.dreamGoals.filter(g => !g.isAchieved).length === 0 && (
                   <p className="text-xs text-gray-400 italic">还没有设定梦想目标...</p>
               )}
               {state.dreamGoals.filter(g => !g.isAchieved).slice(0,2).map(g => (
                   <div key={g.id} className="flex justify-between items-center text-xs bg-purple-50 p-2 rounded">
                       <span className="truncate max-w-[60%]">{g.name}</span>
                       <span className={`font-bold ${state.dreamFund >= g.cost ? 'text-green-600' : 'text-gray-500'}`}>
                           {state.dreamFund >= g.cost ? '可实现' : `¥${g.cost}`}
                       </span>
                   </div>
               ))}
               {state.dreamGoals.filter(g => !g.isAchieved).length > 2 && (
                   <p className="text-xs text-center text-purple-500">...</p>
               )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setActiveModal('ADD_GOAL')}
                    className="flex justify-center items-center py-2 border border-purple-200 text-purple-600 rounded-lg text-xs hover:bg-purple-50 font-bold"
                >
                    <Plus className="w-3 h-3 mr-1" /> 加梦想
                </button>
                <button 
                    onClick={() => setActiveModal('REALIZE_DREAM')}
                    disabled={state.dreamGoals.filter(g => !g.isAchieved).length === 0}
                    className="flex justify-center items-center py-2 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 disabled:bg-gray-300 font-bold"
                >
                    <Target className="w-3 h-3 mr-1" /> 实现梦想
                </button>
            </div>
          </div>

          {/* Play Fund */}
          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-pink-500 flex flex-col h-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-pink-100 p-2 rounded-lg">
                <PartyPopper className="w-6 h-6 text-pink-600" />
              </div>
              <h4 className="font-bold text-gray-800">乐享基金</h4>
            </div>
            <p className="text-sm text-gray-500 mb-2">奖励自己 ({state.percentages.play}%)</p>
            <p className="text-2xl font-bold text-gray-900 mb-4">¥ {state.playFund.toLocaleString()}</p>
            <div className="mt-auto">
                <button 
                    onClick={() => setActiveModal('SPEND_PLAY')}
                    className="w-full flex justify-center items-center py-2 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 font-bold shadow-sm"
                >
                    <Minus className="w-4 h-4 mr-1" /> 
                    乐享生活 (支出)
                </button>
            </div>
          </div>
        </div>

        {/* Main Layout: Split into Income Allocator & Goals/History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Allocator */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-amber-100 h-fit">
                <div className="flex items-center space-x-2 mb-6">
                    <Plus className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-bold text-gray-800">分配收入</h3>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">输入收入总额</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-400">¥</span>
                            <input 
                            type="number" 
                            value={incomeInput}
                            onChange={(e) => handleIncomeChange(e.target.value)}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-lg"
                            placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        {/* Freedom Input */}
                        <div className="flex items-center space-x-3">
                             {/* Percentage Controls */}
                             <div className="flex flex-col items-center justify-center space-y-1">
                                <button onClick={() => adjustPercentage('freedom', 5)} className="text-gray-400 hover:text-amber-500 bg-white border rounded h-5 w-5 flex items-center justify-center transition-colors"><ChevronUp className="w-3 h-3" /></button>
                                <span className="text-xs font-bold text-yellow-600 w-8 text-center">{state.percentages.freedom}%</span>
                                <button onClick={() => adjustPercentage('freedom', -5)} className="text-gray-400 hover:text-amber-500 bg-white border rounded h-5 w-5 flex items-center justify-center transition-colors"><ChevronDown className="w-3 h-3" /></button>
                             </div>
                            
                            <div className="flex-grow">
                                <label className="text-xs text-gray-500 mb-1 block">财务自由基金</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-gray-400 text-xs">¥</span>
                                    <input 
                                        type="number" 
                                        value={allocations.freedom}
                                        onChange={(e) => handleManualAmountChange('freedom', e.target.value)}
                                        className="w-full pl-5 p-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-yellow-400 outline-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dream Input */}
                        <div className="flex items-center space-x-3">
                             <div className="flex flex-col items-center justify-center space-y-1">
                                <button onClick={() => adjustPercentage('dream', 5)} className="text-gray-400 hover:text-purple-500 bg-white border rounded h-5 w-5 flex items-center justify-center transition-colors"><ChevronUp className="w-3 h-3" /></button>
                                <span className="text-xs font-bold text-purple-600 w-8 text-center">{state.percentages.dream}%</span>
                                <button onClick={() => adjustPercentage('dream', -5)} className="text-gray-400 hover:text-purple-500 bg-white border rounded h-5 w-5 flex items-center justify-center transition-colors"><ChevronDown className="w-3 h-3" /></button>
                             </div>
                            
                            <div className="flex-grow">
                                <label className="text-xs text-gray-500 mb-1 block">梦想基金</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-gray-400 text-xs">¥</span>
                                    <input 
                                        type="number" 
                                        value={allocations.dream}
                                        onChange={(e) => handleManualAmountChange('dream', e.target.value)}
                                        className="w-full pl-5 p-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-purple-400 outline-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Play Input */}
                        <div className="flex items-center space-x-3">
                             <div className="flex flex-col items-center justify-center space-y-1">
                                <button onClick={() => adjustPercentage('play', 5)} className="text-gray-400 hover:text-pink-500 bg-white border rounded h-5 w-5 flex items-center justify-center transition-colors"><ChevronUp className="w-3 h-3" /></button>
                                <span className="text-xs font-bold text-pink-600 w-8 text-center">{state.percentages.play}%</span>
                                <button onClick={() => adjustPercentage('play', -5)} className="text-gray-400 hover:text-pink-500 bg-white border rounded h-5 w-5 flex items-center justify-center transition-colors"><ChevronDown className="w-3 h-3" /></button>
                             </div>
                            
                            <div className="flex-grow">
                                <label className="text-xs text-gray-500 mb-1 block">乐享基金</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-gray-400 text-xs">¥</span>
                                    <input 
                                        type="number" 
                                        value={allocations.play}
                                        onChange={(e) => handleManualAmountChange('play', e.target.value)}
                                        className="w-full pl-5 p-2 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-pink-400 outline-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Validation Message */}
                        {showValidationError && (
                            <div className="text-xs text-red-500 bg-red-50 p-2 rounded flex items-center animate-in fade-in">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                <span>分配总额不等于收入总额 (差额: {diff.toFixed(2)})</span>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={executeAllocation}
                        disabled={!isValidAllocation}
                        className={`w-full flex justify-center items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                            isValidAllocation
                            ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        <Save className="w-5 h-5" />
                        <span>存入资金 (Deposit)</span>
                    </button>
                </div>
            </div>

            {/* Right Column: Transaction History & Goals */}
            <div className="space-y-6">
                
                {/* Transaction History */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
                    <div className="flex items-center space-x-2 mb-4">
                        <History className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-700">账单记录</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {state.transactions.length === 0 ? (
                        <p className="text-gray-400 text-center py-4 text-sm">暂无记录</p>
                        ) : (
                        state.transactions.map((t) => (
                            <div key={t.id} className="group flex items-center justify-between border-b border-gray-50 py-2 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                    t.fundType === 'FREEDOM' ? 'bg-yellow-500' :
                                    t.fundType === 'DREAM' ? 'bg-purple-500' : 'bg-pink-500'
                                    }`} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{t.description}</p>
                                        <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`font-bold text-sm ${t.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-green-600'}`}>
                                        {t.type === 'WITHDRAWAL' ? '-' : '+'} ¥{t.amount.toLocaleString()}
                                    </span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTransaction(t.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all opacity-100"
                                        title="删除此记录"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                        )}
                    </div>
                </div>

                {/* Dream Goals Full List */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
                     <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center space-x-2">
                             <Target className="w-5 h-5 text-purple-500" />
                             <h3 className="text-lg font-bold text-gray-700">我的梦想清单</h3>
                         </div>
                     </div>
                     <div className="space-y-3">
                        {state.dreamGoals.length === 0 && <p className="text-sm text-gray-400 text-center">快去添加你的第一个梦想吧！</p>}
                        {state.dreamGoals.map(goal => (
                            <div key={goal.id} className={`p-3 rounded-lg border flex justify-between items-center ${goal.isAchieved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`font-bold ${goal.isAchieved ? 'text-green-800 line-through' : 'text-gray-800'}`}>{goal.name}</span>
                                        {goal.isAchieved && <CheckCircle className="w-4 h-4 text-green-600" />}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        需要: ¥{goal.cost} {goal.isAchieved && `(已于 ${formatDate(goal.achievedDate!)} 实现)`}
                                    </p>
                                </div>
                                {!goal.isAchieved ? (
                                    <button 
                                        onClick={() => deleteGoal(goal.id)}
                                        className="text-gray-300 hover:text-red-400 p-2 hover:bg-red-50 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-100 rounded">已实现</span>
                                )}
                            </div>
                        ))}
                     </div>
                </div>

            </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Add Goal Modal */}
      {activeModal === 'ADD_GOAL' && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4 text-purple-700">添加新梦想</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-sm font-bold text-gray-600">梦想名称</label>
                          <input type="text" className="w-full border rounded-lg p-2 mt-1" placeholder="例如: 买笔记本电脑" value={modalInputText} onChange={e => setModalInputText(e.target.value)} />
                      </div>
                      <div>
                          <label className="text-sm font-bold text-gray-600">需要金额</label>
                          <input type="number" className="w-full border rounded-lg p-2 mt-1" placeholder="¥" value={modalInputAmount} onChange={e => setModalInputAmount(e.target.value)} />
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                          <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
                          <button onClick={handleAddGoal} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold">添加</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Spend Play Modal */}
      {activeModal === 'SPEND_PLAY' && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4 text-pink-600">乐享支出</h3>
                  <div className="bg-pink-50 p-3 rounded-lg mb-4 text-sm text-pink-800">
                      当前乐享基金余额: ¥{state.playFund}
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-sm font-bold text-gray-600">消费内容</label>
                          <input type="text" className="w-full border rounded-lg p-2 mt-1" placeholder="例如: 看电影" value={modalInputText} onChange={e => setModalInputText(e.target.value)} />
                      </div>
                      <div>
                          <label className="text-sm font-bold text-gray-600">消费金额</label>
                          <input type="number" className="w-full border rounded-lg p-2 mt-1" placeholder="¥" value={modalInputAmount} onChange={e => setModalInputAmount(e.target.value)} />
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                          <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
                          <button onClick={handleSpendPlay} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 font-bold">确认支出</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. Realize Dream Modal (Selection) */}
      {activeModal === 'REALIZE_DREAM' && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4 text-purple-700">实现梦想 ✨</h3>
                  <div className="bg-purple-50 p-3 rounded-lg mb-4 text-sm text-purple-800">
                      当前梦想基金余额: ¥{state.dreamFund}
                  </div>
                  <div className="space-y-4">
                      <label className="text-sm font-bold text-gray-600">选择要实现的梦想</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                          {state.dreamGoals.filter(g => !g.isAchieved).map(goal => (
                              <div 
                                key={goal.id} 
                                onClick={() => setSelectedGoalId(goal.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedGoalId === goal.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                              >
                                  <div className="flex justify-between">
                                      <span className="font-bold text-gray-800">{goal.name}</span>
                                      <span className="text-purple-600">¥{goal.cost}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-6">
                          <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">再等等</button>
                          <button 
                            onClick={checkDreamFunds} 
                            disabled={!selectedGoalId}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold disabled:bg-gray-300"
                          >
                              实现它！
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 4. Combined Spend Confirmation Modal */}
      {activeModal === 'CONFIRM_COMBINED_SPEND' && selectedGoalId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="w-6 h-6 text-pink-500" />
                  <h3 className="text-xl font-bold text-gray-800">梦想基金余额不足</h3>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-gray-700 leading-relaxed">
                  <p>梦想基金还差 
                      <span className="font-bold text-red-500 mx-1">
                        ¥{(state.dreamGoals.find(g => g.id === selectedGoalId)?.cost || 0) - state.dreamFund}
                      </span>
                  。</p>
                  <p className="mt-2">乐享基金余额充足，是否愿意暂时牺牲一部分娱乐，从 <span className="font-bold text-pink-600">乐享基金</span> 中支付剩余款项来实现这个梦想？</p>
              </div>

              <div className="flex justify-end space-x-2">
                  <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">再等等</button>
                  <button onClick={handleCombinedRealization} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 font-bold shadow-md">
                      愿意，实现梦想！
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* 5. Insufficient Funds Gentle Modal */}
      {activeModal === 'INSUFFICIENT_FUNDS' && selectedGoalId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
              
              <div className="flex flex-col items-center text-center mb-4 pt-4">
                  <div className="bg-amber-100 p-4 rounded-full mb-3">
                      <Sun className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">梦想还在路上</h3>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-xl mb-6 text-sm text-gray-600 leading-relaxed space-y-2">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span>目标金额</span>
                      <span className="font-bold text-gray-800">¥{state.dreamGoals.find(g => g.id === selectedGoalId)?.cost}</span>
                  </div>
                   <div className="flex justify-between text-xs pt-1">
                      <span>梦想基金</span>
                      <span>¥{state.dreamFund}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                      <span>乐享基金</span>
                      <span>¥{state.playFund}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-red-500 font-bold">
                      <span>总缺口</span>
                      <span>
                        ¥{(state.dreamGoals.find(g => g.id === selectedGoalId)?.cost || 0) - (state.dreamFund + state.playFund)}
                      </span>
                  </div>
                  
                  <p className="mt-4 text-center italic text-amber-700 font-medium">
                      "请继续为自己的梦想添砖加瓦吧。<br/>距离实现梦想就只差一步啦。✨"
                  </p>
              </div>

              <div className="flex justify-center">
                  <button onClick={closeModal} className="w-full px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold shadow-md transition-all">
                      我会继续加油的！
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

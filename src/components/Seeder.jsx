import { base44 } from '@/api/base44Client';
import React, { useEffect } from 'react';

export default function Seeder() {
    useEffect(() => {
        base44.functions.invoke('seedVistaProducts').then(console.log).catch(console.error);
    }, []);
    return null;
}